import { Play as PlayIcon, Zap, Swords, User, Flame, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext.jsx'
import { LEVELS, getLevel } from '../data/levels.js'
import { SUBJECTS } from '../data/subjects.js'

const MODES = [
  { id: 'solo', label: 'Solo', icon: User, accent: 'from-emerald-500 to-teal-500', desc: 'Entraînement', timePerQ: '20s' },
  { id: 'blitz', label: 'Blitz', icon: Zap, accent: 'from-amber-500 to-orange-500', desc: 'Rapide 15s', timePerQ: '15s' },
  { id: '1v1', label: '1 vs 1', icon: Swords, accent: 'from-rose-500 to-pink-500', desc: 'Duel en ligne', timePerQ: '20s' },
]

export default function Play() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [mode, setMode] = useState('solo')
  const [subjectId, setSubjectId] = useState(user?.subjects?.[0] || 'maths')
  const [levelId, setLevelId] = useState(user?.levelId || 'terminale')

  useEffect(() => {
    if (user?.levelId) {
      setLevelId(user.levelId)
    }
  }, [user?.levelId])

  const level = getLevel(levelId)
  const selectedMode = MODES.find((m) => m.id === mode) || MODES[0]
  const isMix = subjectId === 'culture_generale'
  const selectedSubject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0]

  const start = () => {
    const p = new URLSearchParams()
    p.set('mode', mode)
    p.set('ranked', '1')
    p.set('level', levelId)
    p.set('subject', subjectId)

    navigate(`/matchmaking?${p.toString()}`)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black">Quiz & Défis</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-slate-500 font-medium">Niveau :</span>
            <select
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-brand rounded-lg px-2 py-0.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.short})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600">
          <Flame size={14} />
          <span className="text-xs font-bold">Ranked</span>
        </div>
      </header>

      {/* Mode */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mode de jeu</h2>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const active = mode === m.id
            const Icon = m.icon
            return (
              <motion.button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative p-3 rounded-2xl border-2 text-center transition-all ${
                  active
                    ? 'border-brand bg-brand/5 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.accent} grid place-items-center text-white mx-auto mb-1.5`}>
                  <Icon size={18} />
                </div>
                <p className="font-display font-bold text-xs">{m.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{m.timePerQ}</p>
                {active && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand border-2 border-white dark:border-canvas-dark"
                    layoutId="mode-dot"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Matière */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Matière au programme
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            1 120+ cours officiels
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {/* Option Mixte / Toutes matières */}
          <motion.button
            key="mix"
            onClick={() => setSubjectId('culture_generale')}
            className={`relative p-2.5 rounded-xl border-2 text-center transition-all ${
              isMix
                ? 'border-brand bg-brand/5 shadow-sm'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 grid place-items-center text-white mx-auto mb-1">
              <Sparkles size={16} />
            </div>
            <p className="text-[11px] font-bold">Mixte (Tout)</p>
            {isMix && (
              <motion.div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white dark:border-canvas-dark"
                layoutId="subject-dot"
              />
            )}
          </motion.button>

          {/* Matières officielles du programme */}
          {SUBJECTS.filter((s) => s.id !== 'culture_generale').map((s) => {
            const active = subjectId === s.id
            const Icon = s.icon
            return (
              <motion.button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                className={`relative p-2.5 rounded-xl border-2 text-center transition-all ${
                  active
                    ? 'border-brand bg-brand/5 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} grid place-items-center text-white mx-auto mb-1`}>
                  <Icon size={16} />
                </div>
                <p className="text-[11px] font-bold truncate">{s.shortName || s.name}</p>
                {active && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white dark:border-canvas-dark"
                    layoutId="subject-dot"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Résumé de sélection */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 opacity-10" />
        <div className="relative bg-slate-900 text-white p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedMode.accent} grid place-items-center`}>
              <selectedMode.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {selectedMode.desc} · {level?.short || 'Tle'}
              </p>
              <p className="font-display font-bold text-sm">
                Quiz {isMix ? 'Mixte (Toutes matières)' : selectedSubject.name}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${selectedSubject.color} grid place-items-center`}>
              <selectedSubject.icon size={18} className="text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bouton Lancer */}
      <motion.button
        onClick={start}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-violet-500 text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand/25"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <PlayIcon size={20} />
        {mode === '1v1' ? 'Rechercher un adversaire' : 'Lancer le quiz'}
      </motion.button>

      {mode === '1v1' && (
        <p className="text-center text-[10px] text-slate-400 -mt-3">
          Si aucun adversaire en 15s → partie contre un bot 🤖
        </p>
      )}
    </div>
  )
}
