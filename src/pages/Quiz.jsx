import { ChevronRight, Flag, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardBody } from '../components/ui/Card.jsx'
import MathText from '../components/ui/MathText.jsx'
import QuestionRenderer from '../components/quiz/QuestionRenderer.jsx'
import QuizHeader from '../components/quiz/QuizHeader.jsx'
import QuizActionFooter from '../components/quiz/QuizActionFooter.jsx'
import { useUser } from '../context/UserContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useGameRoom } from '../lib/useGameRoom.js'
import { getCourseById } from '../lib/contentLoader.js'
import { checkAnswer, scoreQuiz, shuffleQuestions } from '../lib/quizEngine.js'
import { botAnswer } from '../lib/botEngine.js'
import { generateQuestionsForCourse } from '../lib/questionService.js'
import { generateGenericFallbackQuestions } from '../lib/quizFallback.js'
import { useQuizTeams } from '../lib/useQuizTeams.js'

const SESSION_KEY = 'nb:quiz-questions'

export default function Quiz() {
  const { courseId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, submitQuiz } = useUser()

  const mode = params.get('mode') || 'solo'
  const ranked = params.get('ranked') !== '0'
  const isChallenge = mode === 'challenge'
  const isBattle = mode === '1v1' || mode === '2v2'
  const isBlitz = mode === 'blitz'
  const isAiBattle = courseId === 'ai-battle'
  const { session } = useAuth()
  const userId = session?.user?.id

  const sessionData = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }, [])

  const roomId = sessionData?.roomId || params.get('room') || null

  const { broadcastScore, opponentName: roomOpponentName, opponentScore: roomOpponentScore, finishRoom } = useGameRoom({
    mode,
    subjectId: sessionData?.subjectId,
    levelId: sessionData?.levelId,
    roomIdOverride: roomId,
    userId,
    userName: user?.name || 'Toi',
    enabled: !!(isBattle && roomId),
  })

  const [generatedQuestions, setGeneratedQuestions] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const course = useMemo(() => {
    if (isAiBattle) {
      if (sessionData && Date.now() - sessionData.generatedAt < 10 * 60 * 1000) {
        return {
          id: 'ai-battle',
          title: 'Battle IA',
          subjectId: sessionData.subjectId || params.get('subject') || 'culture_generale',
          levelId: sessionData.levelId || params.get('level') || 'seconde',
          questions: sessionData.questions,
        }
      }
      navigate('/play', { replace: true })
      return null
    }
    const baseCourse = getCourseById(courseId)
    if (!baseCourse) return null
    if (generatedQuestions && generatedQuestions.length > 0) {
      return { ...baseCourse, questions: generatedQuestions }
    }
    if (baseCourse.questions && baseCourse.questions.length > 0) {
      return isChallenge ? shuffleQuestions(baseCourse) : baseCourse
    }
    return baseCourse
  }, [isAiBattle, courseId, isChallenge, navigate, params, sessionData, generatedQuestions])

  useEffect(() => {
    if (!course || course.questions?.length > 0 || isGenerating || isAiBattle) return

    const generateQuestions = async () => {
      setIsGenerating(true)
      try {
        const questions = await generateQuestionsForCourse(course, course.content || course.description || '', 5)
        if (questions && questions.length > 0) {
          setGeneratedQuestions(isChallenge ? shuffleQuestions({ questions }).questions : questions)
        } else {
          setGeneratedQuestions(generateGenericFallbackQuestions(course, 5))
        }
      } catch (err) {
        setGeneratedQuestions(generateGenericFallbackQuestions(course, 5))
      } finally {
        setIsGenerating(false)
      }
    }
    generateQuestions()
  }, [course, courseId, isChallenge, isAiBattle])

  const { meRef, teamARef, teamBRef, refresh } = useQuizTeams({
    mode, user, roomId, roomOpponentName, roomOpponentScore,
  })

  const hasRealOpponent = !!(roomId && roomOpponentName)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [locked, setLocked] = useState(false)
  const [shake, setShake] = useState(false)
  const [opponentsThinking, setOpponentsThinking] = useState(false)
  const [reported, setReported] = useState(new Set())

  useEffect(() => {
    setAnswers({})
    setIndex(0)
    setLocked(false)
    setReported(new Set())
  }, [courseId])

  const TIMER_SEC = isBlitz ? 15 : isBattle ? 30 : 0
  const [timeLeft, setTimeLeft] = useState(TIMER_SEC)
  const timerRef = useRef(null)

  const reportQuestion = (qId) => setReported((prev) => new Set([...prev, qId]))

  const questions = course?.questions || []
  const q = questions[index]
  const total = questions.length
  const userAnswer = answers[q?.id]
  const canValidate = userAnswer !== undefined && userAnswer !== '' && userAnswer !== null
  const isLast = index === total - 1

  const handleChange = (val) => {
    if (locked || !q?.id) return
    setAnswers((a) => ({ ...a, [q.id]: val }))
  }

  const simulateOpponents = () => {
    if (!isBattle) return
    setOpponentsThinking(true)
    const allOpponents = [...teamARef.current.filter((p) => !p.isMe), ...teamBRef.current]
    setTimeout(() => {
      for (const bot of allOpponents) {
        const { correct } = botAnswer(bot, q)
        bot.answers[q.id] = correct
        if (correct) {
          bot.correct += 1
          bot.score = Math.round((bot.correct / total) * 100)
        }
      }
      setOpponentsThinking(false)
      refresh()
    }, 900 + Math.random() * 800)
  }

  useEffect(() => {
    if (!TIMER_SEC || locked) return
    setTimeLeft(TIMER_SEC)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setLocked(true)
          setShake(true)
          setTimeout(() => setShake(false), 400)
          if (isBattle || isBlitz) simulateOpponents()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [index, locked, TIMER_SEC])

  if (!course || !q) {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 animate-pulse">
            L'IA prépare des questions pour ce cours...
          </p>
        </div>
      )
    }
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <p className="text-slate-600 dark:text-slate-400">Ce cours ne contient pas encore de quiz.</p>
        <button onClick={() => navigate('/play')} className="px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand/90">
          Retour au menu
        </button>
      </div>
    )
  }

  const validate = () => {
    if (!canValidate) return
    clearInterval(timerRef.current)
    const correct = checkAnswer(q, userAnswer)
    setLocked(true)
    if (correct) {
      meRef.current.correct += 1
      meRef.current.score = Math.round((meRef.current.correct / total) * 100)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
    if (roomId) broadcastScore(meRef.current.score, meRef.current.correct)
    if (!hasRealOpponent) simulateOpponents()
    else refresh()
  }

  const next = () => {
    if (isLast) {
      const result = scoreQuiz(course, answers)
      const xpData = submitQuiz({
        courseId: course.id,
        subjectId: course.subjectId,
        levelId: course.levelId,
        score: result.score,
        accuracy: result.accuracy,
        correct: result.correctCount,
        total: result.total,
        ranked,
        mode,
      })
      if (roomId) finishRoom()
      navigate(`/results/${course.id}`, {
        state: {
          result,
          answers,
          mode,
          ranked,
          teamA: isBattle ? teamARef.current : null,
          teamB: isBattle ? teamBRef.current : null,
          xpGain: xpData?.xpGain ?? 0,
          breakdown: xpData?.breakdown ?? {},
          antiSpam: xpData?.antiSpam ?? 1,
          reports: reported.size > 0
            ? [...reported].map((id) => ({
                questionId: id,
                subjectId: course.subjectId,
                levelId: course.levelId,
                question: course.questions.find((qq) => qq.id === id),
              }))
            : [],
        },
        replace: true,
      })
      return
    }
    setLocked(false)
    setIndex((i) => i + 1)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <QuizHeader
        index={index}
        total={total}
        locked={locked}
        timeLeft={timeLeft}
        timerSec={TIMER_SEC}
        isBattle={isBattle}
        teamA={teamARef.current}
        teamB={teamBRef.current}
        mode={mode}
        onQuit={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <Card className={`${shake ? 'animate-shake' : ''} border-slate-200 dark:border-slate-700`}>
          <CardBody className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand/10 dark:bg-brand/20 grid place-items-center">
                <Zap size={16} className="text-brand" />
              </span>
              <h2 className="font-display text-lg font-bold leading-snug flex-1 text-slate-900 dark:text-white">
                <MathText>{q.prompt}</MathText>
              </h2>
              {locked && (
                <button
                  onClick={() => reportQuestion(q.id)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg grid place-items-center transition-colors ${
                    reported.has(q.id) ? 'bg-rose-500/20 text-rose-500' : 'text-slate-400 hover:text-rose-400'
                  }`}
                  aria-label="Signaler la question"
                >
                  <Flag size={14} />
                </button>
              )}
            </div>

            <QuestionRenderer
              key={q?.id || index}
              question={q}
              locked={locked}
              userAnswer={userAnswer}
              onChange={handleChange}
              onSubmit={validate}
            />

            {locked && q.explanation && (
              <motion.div 
                className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="font-bold text-brand">Explication — </span>
                <MathText>{q.explanation}</MathText>
              </motion.div>
            )}

            {isBattle && locked && opponentsThinking && (
              <p className="mt-3 text-xs text-slate-400 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand animate-bounce" />
                Adversaires en train de répondre…
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <QuizActionFooter
        locked={locked}
        canValidate={canValidate}
        onValidate={validate}
        onNext={next}
        isLast={isLast}
        isWaiting={isBattle && opponentsThinking}
      />
    </div>
  )
}
