import { useEffect, useRef, useState } from 'react'
import { createBots } from './botEngine.js'

export function useQuizTeams({ mode, user, roomId, roomOpponentName, roomOpponentScore }) {
  const meRef = useRef({
    id: 'me',
    name: user?.name || 'Toi',
    isMe: true,
    score: 0,
    correct: 0,
    answers: {},
  })
  const teamARef = useRef([])
  const teamBRef = useRef([])
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate((n) => n + 1)

  const hasRealOpponent = !!(roomId && roomOpponentName)
  const realOpponentRef = useRef(null)

  useEffect(() => {
    meRef.current = { ...meRef.current, name: user?.name || 'Toi' }
    if (mode === '1v1') {
      if (hasRealOpponent) {
        realOpponentRef.current = realOpponentRef.current || {
          id: 'opponent', name: roomOpponentName, isMe: false, score: 0, correct: 0, answers: {},
        }
        teamARef.current = [meRef.current]
        teamBRef.current = [realOpponentRef.current]
      } else {
        teamARef.current = [meRef.current]
        teamBRef.current = createBots(1, { skill: 'medium' })
      }
    } else if (mode === '2v2') {
      teamARef.current = [meRef.current, ...createBots(1, { skill: 'medium' })]
      teamBRef.current = createBots(2, { skill: 'medium' })
    } else {
      teamARef.current = [meRef.current]
      teamBRef.current = []
    }
    refresh()
  }, [mode, hasRealOpponent, roomOpponentName, user?.name])

  useEffect(() => {
    if (!realOpponentRef.current) return
    realOpponentRef.current.score = roomOpponentScore
    refresh()
  }, [roomOpponentScore])

  return { meRef, teamARef, teamBRef, refresh }
}
