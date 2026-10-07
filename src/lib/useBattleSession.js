import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { calculateEloChange, INITIAL_ELO } from './eloSystem.js'

export const TIME_PER_QUESTION = 20
export const QUESTION_COUNT = 8
export const GAME_MAX_DURATION = 5 * 60 * 1000
export const BASE_POINTS = 10
export const MAX_SPEED_BONUS = 10

export function calcPoints(isCorrect, timeLeft) {
  if (!isCorrect) return 0
  const speedBonus = Math.round((timeLeft / TIME_PER_QUESTION) * MAX_SPEED_BONUS)
  return BASE_POINTS + speedBonus
}

export function useBattleSession({ roomId, user, session, profile, submitQuiz, searchParams }) {
  const isSolo = !roomId
  const userId = session?.user?.id
  const myElo = user?.elo || INITIAL_ELO

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [myCorrect, setMyCorrect] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [opponentAnsweredCount, setOpponentAnsweredCount] = useState(0)
  const [opponentName, setOpponentName] = useState('Adversaire')
  const [opponentAvatar, setOpponentAvatar] = useState(null)
  const [opponentAvatarSeed, setOpponentAvatarSeed] = useState(null)
  const [opponentElo, setOpponentElo] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [isFinished, setIsFinished] = useState(false)
  const [gamePhase, setGamePhase] = useState('playing')
  const [gameResult, setGameResult] = useState(null)
  const [showFeedback, setShowFeedback] = useState(null)
  const [botEnabled, setBotEnabled] = useState(false)
  const botAccuracy = useRef(0.55 + Math.random() * 0.25)

  const stateRef = useRef({
    myScore: 0, myCorrect: 0, opponentScore: 0, opponentFinalScore: 0,
    opponentHasFinished: false, opponentAnsweredCount: 0,
    questions: [], currentIndex: 0, isFinished: false, roomId, userId,
    opponentElo: null, answers: [],
  })
  const channelRef = useRef(null)
  const amIHost = useRef(false)
  const gameResultCalledRef = useRef(false)

  const updateRef = useCallback(() => {
    stateRef.current = {
      ...stateRef.current,
      myScore, myCorrect, opponentScore, currentIndex,
      isFinished, questions, roomId, userId, opponentElo,
    }
  }, [myScore, myCorrect, opponentScore, currentIndex, isFinished, questions, roomId, userId, opponentElo])

  useEffect(() => { updateRef() }, [updateRef])

  const saveResults = useCallback(async (finalScore, oppScore, iWon, isTie, eloResult) => {
    const s = stateRef.current
    if (!s.userId) return

    try {
      const finalCorrect = stateRef.current.myCorrect
      const accuracy = s.questions.length > 0 ? finalCorrect / s.questions.length : 0

      await submitQuiz({
        courseId: `battle-${s.roomId || 'solo'}`,
        subjectId: s.questions[0]?.subject || 'culture_generale',
        levelId: user?.levelId || 'seconde',
        mode: s.roomId ? '1v1' : 'solo',
        score: finalScore,
        opponentScore: oppScore,
        correct: finalCorrect,
        total: s.questions.length,
        accuracy,
        battleWin: iWon && !isTie,
        eloChange: eloResult?.change || 0,
        newElo: eloResult?.newElo || myElo,
      })

      if (eloResult && eloResult.change !== 0) {
        await supabase.from('profiles').update({ elo: eloResult.newElo }).eq('id', s.userId)
      }
    } catch (err) {
      console.error('saveResults error:', err)
    }

    if (s.roomId && supabase) {
      await supabase.from('game_rooms').update({
        status: 'done',
        finished_at: new Date().toISOString(),
        winner_id: iWon ? s.userId : null,
        host_score: amIHost.current ? finalScore : oppScore,
        guest_score: amIHost.current ? oppScore : finalScore,
      }).eq('id', s.roomId)
    }
  }, [submitQuiz, user?.levelId, myElo])

  const resolveGame = useCallback((myFinalScore, oppFinalScore) => {
    if (gameResultCalledRef.current) return
    gameResultCalledRef.current = true

    const iWon = isSolo ? true : myFinalScore > oppFinalScore
    const isTie = !isSolo && myFinalScore === oppFinalScore

    let eloResult = null
    if (!isSolo && roomId) {
      eloResult = calculateEloChange({
        playerElo: myElo,
        opponentElo: opponentElo || INITIAL_ELO,
        won: iWon,
        draw: isTie,
        scoreDifference: myFinalScore - oppFinalScore,
      })
    }

    setGameResult({
      winner: iWon,
      isTie,
      myScore: myFinalScore,
      oppScore: oppFinalScore,
      eloResult,
    })
    setGamePhase('done')
    setIsFinished(true)

    saveResults(myFinalScore, oppFinalScore, iWon, isTie, eloResult)
  }, [isSolo, roomId, myElo, opponentElo, saveResults])

  const handleAnswer = useCallback((answerValue, isCorrect) => {
    const s = stateRef.current
    if (s.isFinished) return

    const points = calcPoints(isCorrect, timeLeft)
    const newScore = s.myScore + points
    const newCorrect = s.myCorrect + (isCorrect ? 1 : 0)
    const newAnswers = [...s.answers, { questionIndex: s.currentIndex, answerValue, isCorrect, points }]

    setMyScore(newScore)
    setMyCorrect(newCorrect)
    stateRef.current.myScore = newScore
    stateRef.current.myCorrect = newCorrect
    stateRef.current.answers = newAnswers

    setShowFeedback({ correct: isCorrect, points, key: Date.now() })
    setTimeout(() => setShowFeedback(null), 800)

    if (channelRef.current && s.userId) {
      const isLast = s.currentIndex >= s.questions.length - 1
      channelRef.current.send({
        type: 'broadcast',
        event: isLast ? 'finished' : 'score',
        payload: {
          userId: s.userId,
          userName: user?.name || 'Moi',
          score: newScore,
          correct: newCorrect,
          answeredCount: newAnswers.length,
          totalQuestions: s.questions.length,
        }
      })
    }

    if (s.currentIndex < s.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeLeft(TIME_PER_QUESTION)
    } else {
      stateRef.current.isFinished = true
      setGamePhase('waiting')
      setIsFinished(true)

      if (isSolo) {
        if (botEnabled && !stateRef.current.opponentHasFinished) {
          setTimeout(() => {
            const botFinalScore = stateRef.current.opponentScore
            stateRef.current.opponentHasFinished = true
            setOpponentAnsweredCount(stateRef.current.questions.length)
            resolveGame(newScore, botFinalScore)
          }, 1000 + Math.random() * 2000)
        } else {
          resolveGame(newScore, botEnabled ? stateRef.current.opponentScore : 0)
        }
      } else {
        if (stateRef.current.opponentHasFinished) {
          resolveGame(newScore, stateRef.current.opponentFinalScore)
        } else {
          const waitStart = Date.now()
          const checkInterval = setInterval(() => {
            if (stateRef.current.opponentHasFinished || Date.now() - waitStart > 30000) {
              clearInterval(checkInterval)
              const oppScore = stateRef.current.opponentHasFinished 
                ? stateRef.current.opponentFinalScore 
                : stateRef.current.opponentScore
              resolveGame(newScore, oppScore)
            }
          }, 500)
        }
      }
    }
  }, [timeLeft, user?.name, isSolo, resolveGame, botEnabled])

  useEffect(() => {
    if (isFinished || questions.length === 0) return
    if (timeLeft <= 0) {
      handleAnswer(null, false)
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, isFinished, questions.length, handleAnswer])

  useEffect(() => {
    if (!botEnabled || isFinished || questions.length === 0) return
    if (currentIndex >= questions.length) return
    
    const botDelay = 1000 + Math.random() * 4000
    const botTimer = setTimeout(() => {
      if (stateRef.current.isFinished) return
      
      const botGotCorrect = Math.random() < botAccuracy.current
      const simulatedTimeLeft = Math.round(2 + Math.random() * (TIME_PER_QUESTION - 2))
      const botPoints = calcPoints(botGotCorrect, simulatedTimeLeft)
      const newBotScore = stateRef.current.opponentScore + botPoints
      const newBotAnswered = (stateRef.current.opponentAnsweredCount || 0) + 1
      
      setOpponentScore(newBotScore)
      setOpponentAnsweredCount(newBotAnswered)
      stateRef.current.opponentScore = newBotScore
      stateRef.current.opponentAnsweredCount = newBotAnswered
      
      if (newBotAnswered >= questions.length) {
        stateRef.current.opponentHasFinished = true
        stateRef.current.opponentFinalScore = newBotScore
      }
    }, botDelay)
    
    return () => clearTimeout(botTimer)
  }, [botEnabled, currentIndex, isFinished, questions])

  useEffect(() => {
    if (!roomId || !supabase || !userId) return

    const channel = supabase
      .channel(`battle-${roomId}`)
      .on('broadcast', { event: 'score' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setOpponentScore(payload.score)
          stateRef.current.opponentScore = payload.score
          if (payload.userName) setOpponentName(payload.userName)
          if (payload.answeredCount !== undefined) {
            setOpponentAnsweredCount(payload.answeredCount)
            stateRef.current.opponentAnsweredCount = payload.answeredCount
          }
        }
      })
      .on('broadcast', { event: 'finished' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setOpponentScore(payload.score)
          stateRef.current.opponentFinalScore = payload.score
          stateRef.current.opponentScore = payload.score
          stateRef.current.opponentHasFinished = true
          setOpponentAnsweredCount(QUESTION_COUNT)

          if (stateRef.current.isFinished && gamePhase === 'waiting') {
            resolveGame(stateRef.current.myScore, payload.score)
          }
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, userId, gamePhase, resolveGame])

  useEffect(() => {
    const cached = sessionStorage.getItem('nb:ai-questions')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (data.questions?.length) {
          setQuestions(data.questions)
          stateRef.current.questions = data.questions
        }
        if (data.opponentName) setOpponentName(data.opponentName)
        if (data.opponentAvatar) setOpponentAvatar(data.opponentAvatar)
        if (data.opponentAvatarSeed) setOpponentAvatarSeed(data.opponentAvatarSeed)
        if (data.opponentElo) setOpponentElo(data.opponentElo)
        amIHost.current = data.hostId === userId
        if (!data.roomId && data.opponentName) {
          setBotEnabled(true)
        }
      } catch (err) {
        console.error('Error parsing cached questions:', err)
      }
    }
  }, [userId])

  return {
    questions,
    currentIndex,
    currentQ: questions[currentIndex] || null,
    myScore,
    myCorrect,
    opponentScore,
    opponentAnsweredCount,
    opponentName,
    opponentAvatar,
    opponentAvatarSeed,
    opponentElo,
    timeLeft,
    gamePhase,
    gameResult,
    showFeedback,
    isSolo,
    myElo,
    handleAnswer,
    botEnabled,
  }
}
