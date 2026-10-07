import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Bot, GraduationCap, Swords, Users, Wifi, WifiOff, Zap, X, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useUser } from '../../context/UserContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useGameRoom } from '../../lib/useGameRoom.js'
import { getSubject } from '../../data/subjects.js'
import { getLevel } from '../../data/levels.js'
import { getRandomQuestionsFromCourses } from '../../lib/contentLoader.js'
import Avatar from '../ui/Avatar.jsx'
import RankBadge from '../ui/RankBadge.jsx'
import Button from '../ui/Button.jsx'

const BOT_FALLBACK_DELAY = 15

export default function PvpMatchmaking({ mode, subjectId, levelId, topic, ranked }) {
  const navigate = useNavigate()
  const { user, totalXp } = useUser()
  const { session, profile } = useAuth()
  const userId = session?.user?.id
  const userName = user?.name || 'Anonyme'

  const {
    room, roomStatus, opponentName, opponentAvatar, opponentAvatarSeed,
    findOrCreate, setRoomQuestions, cancelMatchmaking, isHost,
  } = useGameRoom({ mode, subjectId, levelId, topic, userId, userName, enabled: true })

  const [isCancelled, setIsCancelled] = useState(false)
  const [stepMsg, setStepMsg] = useState('Connexion au serveur…')
  const [aiDone, setAiDone] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const startRef = useRef(Date.now())
  const hasSearchedRef = useRef(false)
  const countdownStartedRef = useRef(false)

  const subject = getSubject(subjectId)
  const level = getLevel(levelId)
  const ModeIcon = mode === '2v2' ? Users : Swords
  const modeTitle = mode === '2v2' ? 'Battle 2 vs 2' : 'Battle 1 vs 1'

  const myAvatarUrl = user?.avatarUrl || profile?.avatar_url || session?.user?.user_metadata?.avatar_url || null

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 500)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!userId || hasSearchedRef.current) return
    hasSearchedRef.current = true
    findOrCreate()
  }, [userId, findOrCreate])

  useEffect(() => {
    if (roomStatus === 'searching') setStepMsg('Recherche d\'un adversaire…')
    if (roomStatus === 'waiting') setStepMsg('En attente d\'un adversaire…')
    if (roomStatus === 'ready') setStepMsg('Adversaire trouvé !')
    if (roomStatus === 'playing') setStepMsg('C\'est parti !')
  }, [roomStatus])

  useEffect(() => {
    if ((roomStatus === 'ready' || roomStatus === 'playing') && !countdownStartedRef.current) {
      countdownStartedRef.current = true
      setCountdown(3)
    }
  }, [roomStatus])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const opponentFromRoom = room?.guest_id && room?.guest_id !== userId
    ? { name: room?.guest_name, avatar: room?.guest_avatar, avatarSeed: room?.guest_avatar_seed, xp: room?.guest_xp, elo: room?.guest_elo }
    : room?.host_id && room?.host_id !== userId
      ? { name: room?.host_name, avatar: room?.host_avatar, avatarSeed: room?.host_avatar_seed, xp: room?.host_xp, elo: room?.host_elo }
      : { name: null, avatar: null, avatarSeed: null, xp: 0, elo: 400 }

  const opponentDisplayName = opponentName || opponentFromRoom.name || '???'
  const opponentDisplayAvatar = opponentFromRoom.avatar || null
  const opponentDisplayAvatarSeed = opponentFromRoom.avatarSeed || null
  const opponentDisplayXp = opponentFromRoom.xp || 0
  const opponentDisplayElo = opponentFromRoom.elo || 400

  useEffect(() => {
    if (!isHost || roomStatus !== 'ready' || aiDone) return
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
              const token = session?.access_token
              const res = await supabase.functions.invoke('generate-questions', {
                body: { subjectId, levelId, questionCount: 8, ...(topic ? { topic } : {}) },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              })
              if (res.data?.questions?.length) {
                questions = res.data.questions
              }
            } catch (callErr) {
              console.warn('[PvpMatchmaking] Edge function inaccessible, fallback local:', callErr)
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

        await setRoomQuestions(questions)
        setAiDone(true)
      } catch (err) {
        if (!cancelled) setAiError(err.message)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [isHost, roomStatus, aiDone, session, subjectId, levelId, topic, setRoomQuestions])

  const handleCancel = useCallback(async () => {
    setIsCancelled(true)
    await cancelMatchmaking()
    navigate('/play', { replace: true })
  }, [cancelMatchmaking, navigate])

  useEffect(() => {
    if (isCancelled || roomStatus !== 'playing' || !room?.questions?.length) return
    if (countdown !== null && countdown > 0) return
    sessionStorage.setItem('nb:ai-questions', JSON.stringify({
      questions: room.questions,
      subjectId, levelId, mode, ranked,
      roomId: room.id,
      hostId: room.host_id,
      opponentName: opponentName || 'Adversaire',
      opponentAvatar,
      opponentAvatarSeed,
      opponentElo: opponentDisplayElo,
      generatedAt: Date.now(),
    }))
    navigate(`/battle?room=${room.id}&mode=${mode}&subject=${subjectId}&level=${levelId}`, { replace: true })
  }, [roomStatus, room, navigate, mode, ranked, subjectId, levelId, opponentName, countdown, opponentDisplayElo, isCancelled, opponentAvatar, opponentAvatarSeed])

  const waitingForOpponent = roomStatus === 'waiting'
  const foundOpponent = roomStatus === 'ready' || roomStatus === 'playing'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="relative">
        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 grid place-items-center text-white shadow-glow transition-all duration-300 ${foundOpponent ? 'scale-110' : ''}`}>
          <ModeIcon size={36} />
        </div>
        <span className={`absolute inset-0 rounded-3xl bg-rose-500/30 ${waitingForOpponent ? 'animate-ping' : foundOpponent ? 'animate-pulse' : ''} pointer-events-none`} />
      </div>

      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{modeTitle}</h1>
        <p className="text-sm text-ink-mute dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <BookOpen size={14} /> {subject?.name}
          </span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1">
            <GraduationCap size={14} /> {level?.name}
          </span>
          {topic && <span className="ml-2 text-brand font-medium">· {topic}</span>}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <PlayerSlot name={userName} isMe filled avatarUrl={myAvatarUrl} avatarSeed={user?.avatarSeed} xp={totalXp} />
        <div className="relative flex-shrink-0 px-2">
          <div className={`font-display font-bold text-xl sm:text-2xl transition-all duration-500 ${foundOpponent ? 'text-emerald-500 scale-125' : 'text-ink-mute'}`}>
            VS
          </div>
        </div>
        <PlayerSlot name={opponentDisplayName} filled={foundOpponent} searching={waitingForOpponent} avatarUrl={opponentDisplayAvatar} avatarSeed={opponentDisplayAvatarSeed} xp={opponentDisplayXp} pulse={foundOpponent} />
      </div>

      {countdown !== null && countdown > 0 && foundOpponent && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-violet-600 grid place-items-center text-white shadow-glow animate-pulse">
            <span className="font-display text-4xl font-black tabular-nums">{countdown}</span>
          </div>
          <span className="text-xs text-ink-mute font-semibold">Prépare-toi…</span>
        </div>
      )}

      {countdown === 0 && foundOpponent && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-emerald-500 grid place-items-center text-white shadow-glow">
            <span className="font-display text-2xl font-black">GO!</span>
          </div>
        </div>
      )}

      {(countdown === null || !foundOpponent) && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
          foundOpponent ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {foundOpponent ? <Wifi size={12} /> : <WifiOff size={12} />}
          {stepMsg}
        </div>
      )}

      {waitingForOpponent && elapsed >= BOT_FALLBACK_DELAY && (
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Clock size={14} className="text-amber-500" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Pas d'adversaire trouvé en {elapsed}s
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={async () => {
                setIsCancelled(true)
                await cancelMatchmaking()
                navigate(`/battle?mode=solo&subject=${subjectId}&level=${levelId}`, { replace: true })
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
            >
              <Bot size={16} /> Jouer vs Bot
            </button>
            <button
              onClick={() => {
                setIsCancelled(true)
                cancelMatchmaking()
                navigate(`/battle?mode=solo&subject=${subjectId}&level=${levelId}`, { replace: true })
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Zap size={16} /> Solo classique
            </button>
          </div>
        </div>
      )}

      {rateLimited && (
        <div className="text-center space-y-2 max-w-xs">
          <p className="font-display font-bold text-sm">Limite atteinte</p>
          <p className="text-xs text-ink-mute dark:text-slate-400">Trop de parties cette heure-ci.</p>
          <button onClick={() => navigate('/play')} className="text-xs text-brand underline">Retour au menu</button>
        </div>
      )}

      {aiError && (
        <div className="text-center space-y-2">
          <p className="text-xs text-rose-500">Erreur de chargement : {aiError}</p>
          <Button onClick={() => navigate('/play')} variant="outline" size="sm" className="text-ink-mute">
            Retour
          </Button>
        </div>
      )}

      {(countdown === null && !foundOpponent) && (
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <X size={16} /> Annuler la recherche
        </button>
      )}
    </div>
  )
}

function PlayerSlot({ name, isMe, filled, searching, avatarUrl, avatarSeed, xp, pulse = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-w-[120px] sm:min-w-[140px]">
      <div className={`relative transition-all duration-500 flex items-center justify-center ${
        filled ? 'scale-100' : 'scale-95 opacity-60'
      } ${pulse ? 'animate-pulse' : ''}`}>
        {filled ? (
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
            isMe
              ? 'ring-3 ring-brand shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              : 'ring-3 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}>
            <Avatar name={name} avatarUrl={avatarUrl} avatarSeed={avatarSeed} size="xl" />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 border-2 border-dashed border-black/20 dark:border-white/20 flex items-center justify-center">
            {searching ? (
              <div className="relative w-8 h-8">
                <span className="absolute inset-0 w-8 h-8 border-2 border-ink-mute/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (
              <span className="text-3xl text-ink-mute/40">?</span>
            )}
          </div>
        )}
        
        {filled && xp !== undefined && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-canvas-surface dark:bg-canvas-dark px-2 py-0.5 rounded-full shadow-md border border-black/5">
              <RankBadge xp={xp} size="xs" showLabel={false} />
            </div>
          </div>
        )}
        
        {filled && !isMe && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-canvas-light dark:border-canvas-dark shadow-md" />
        )}
      </div>
      
      <div className={`text-center transition-all duration-300 min-h-[40px] flex flex-col items-center justify-center ${filled ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-1'}`}>
        <span className={`text-sm font-display font-bold whitespace-nowrap ${isMe ? 'text-brand dark:text-brand-dark' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {filled ? (isMe ? 'Toi' : name) : 'En attente…'}
        </span>
        {filled && xp !== undefined && (
          <span className="text-xs text-ink-mute font-mono tabular-nums">{xp} XP</span>
        )}
      </div>
    </div>
  )
}
