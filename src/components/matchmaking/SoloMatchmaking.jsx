import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Wifi, WifiOff, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { getSubject } from '../../data/subjects.js'
import { getLevel } from '../../data/levels.js'
import { getRandomQuestionsFromCourses } from '../../lib/contentLoader.js'

const SESSION_KEY = 'nb:ai-questions'
const MATCHMAKING_DURATION = 12

const SOLO_STEPS = [
  { at: 1, msg: 'Analyse de ton niveau…' },
  { at: 3, msg: 'Préparation des questions…' },
  { at: 7, msg: 'Questions prêtes…' },
  { at: 10, msg: 'On y va !' },
]

export default function SoloMatchmaking({ mode, subjectId, levelId, topic, ranked }) {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [stepMsg, setStepMsg] = useState(SOLO_STEPS[0].msg)
  const [aiDone, setAiDone] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [rateLimited, setRateLimited] = useState(false)
  const startRef = useRef(Date.now())

  const subject = getSubject(subjectId)
  const level = getLevel(levelId)
  const isBlitz = mode === 'blitz'
  const ModeIcon = isBlitz ? Zap : UserCheck
  const modeTitle = isBlitz ? 'Mode Blitz' : 'Quiz Solo'

  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000)
      setElapsed(Math.min(s, MATCHMAKING_DURATION))
      const step = [...SOLO_STEPS].reverse().find((f) => s >= f.at)
      if (step) setStepMsg(step.msg)
    }, 250)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        sessionStorage.removeItem(SESSION_KEY)
        let questions = []

        // 1. Si matière spécifique (maths, physique, svt, etc.) → banque officielle du programme scolaire
        if (subjectId && subjectId !== 'culture_generale') {
          questions = getRandomQuestionsFromCourses({ subjectId, levelId, count: 8, topic })
        } else {
          // 2. Si Culture Générale ou Mixte : tenter l'Edge Function puis fallback équilibré multi-matières
          if (supabase) {
            try {
              const { data: { session } } = await supabase.auth.getSession()
              const token = session?.access_token
              const res = await supabase.functions.invoke('generate-questions', {
                body: { subjectId, levelId, questionCount: 8, ...(topic ? { topic } : {}) },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              })
              if (res.data?.questions?.length) {
                questions = res.data.questions
              }
            } catch (apiErr) {
              console.warn('[SoloMatchmaking] Edge function inaccessible, bascule sur la banque locale:', apiErr)
            }
          }

          if (!questions.length) {
            questions = getRandomQuestionsFromCourses({ subjectId: 'culture_generale', levelId, count: 8, topic })
          }
        }

        if (cancelled) return

        if (!questions.length) {
          throw new Error('Aucune question disponible')
        }

        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          questions, subjectId, levelId, mode, ranked, generatedAt: Date.now(),
        }))
        setAiDone(true)
      } catch (err) {
        if (!cancelled) setAiError(err.message)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [subjectId, levelId, mode, ranked, topic])

  useEffect(() => {
    if (aiDone && elapsed >= 3) {
      navigate(`/battle?mode=${mode}&ranked=${ranked ? '1' : '0'}&subject=${subjectId}&level=${levelId}`, { replace: true })
    }
  }, [aiDone, elapsed, navigate, mode, ranked, subjectId, levelId])

  const progress = Math.min((elapsed / MATCHMAKING_DURATION) * 100, aiDone ? 100 : 95)

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-8 px-4">
      <div className="relative">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${isBlitz ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-violet-600'} grid place-items-center text-white shadow-glow`}>
          <ModeIcon size={40} />
        </div>
        <span className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping pointer-events-none" />
      </div>

      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl font-bold">{modeTitle}</h1>
        <p className="text-sm text-ink-mute dark:text-slate-400">
          {subject?.name} · {level?.name}
          {topic && <span className="ml-1 text-brand font-medium">· {topic}</span>}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-ink-mute dark:text-slate-400">
          <span className="flex items-center gap-1">
            {aiError ? <WifiOff size={12} className="text-rose-500" /> : <Wifi size={12} className="text-emerald-500" />}
            {aiError ? 'Erreur réseau' : stepMsg}
          </span>
          <span className="tabular-nums font-semibold">{elapsed < MATCHMAKING_DURATION ? `~${MATCHMAKING_DURATION - elapsed}s` : 'Prêt'}</span>
        </div>
      </div>

      {rateLimited && (
        <div className="text-center space-y-2 max-w-xs">
          <p className="font-display font-bold text-sm">Limite atteinte</p>
          <p className="text-xs text-ink-mute dark:text-slate-400">Tu as lancé trop de parties cette heure-ci. Reviens dans quelques minutes.</p>
          <button onClick={() => navigate('/play')} className="text-xs text-brand underline">Retour au menu</button>
        </div>
      )}

      {!rateLimited && aiError && (
        <div className="text-center space-y-2">
          <p className="text-xs text-ink-mute dark:text-slate-400 max-w-xs">Impossible de charger les questions. Réessaie.</p>
          <button onClick={() => navigate('/play')} className="text-xs text-brand underline">Retour au menu</button>
        </div>
      )}
    </div>
  )
}
