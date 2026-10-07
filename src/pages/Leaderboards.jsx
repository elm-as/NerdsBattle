import { Crown, Globe2, Sparkles, Trophy, TrendingUp, Atom, Palette, Landmark, Music, Mountain, Microscope, Calculator } from 'lucide-react'
import Flag from '../components/ui/Flag.jsx'
import { useEffect, useState } from 'react'
import { Card, CardBody } from '../components/ui/Card.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { useUser } from '../context/UserContext.jsx'
import { fetchLeaderboard } from '../lib/leaderboard.js'
import { getCountry } from '../data/countries.js'
import { getLevel } from '../data/levels.js'
import { motion } from 'framer-motion'

const levelShort = (id) => getLevel(id)?.short || id

const SCOPES = [
  { value: 'world', label: 'Monde' },
  { value: 'country', label: 'Pays' },
  { value: 'level', label: 'Niveau' }
]

const THEMES = [
  { value: 'maths', label: 'Maths', icon: Calculator },
  { value: 'histoire', label: 'Histoire', icon: Landmark },
  { value: 'sciences', label: 'Sciences', icon: Atom },
  { value: 'geographie', label: 'Géographie', icon: Globe2 },
  { value: 'arts', label: 'Arts', icon: Palette },
  { value: 'sport', label: 'Sport', icon: Trophy },
  { value: 'musique', label: 'Musique', icon: Music },
  { value: 'nature', label: 'Nature', icon: Mountain },
  { value: 'technologie', label: 'Technologie', icon: Microscope },
]

export default function Leaderboards() {
  const { user } = useUser()
  const [scope, setScope] = useState('world')
  const [subjectId, setSubjectId] = useState('histoire')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [liveBoard, setLiveBoard] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const effectiveScope = (scope === 'world' && showThemePicker) ? 'subject' : scope
    fetchLeaderboard({
      scope: effectiveScope,
      levelId: effectiveScope === 'level' ? user?.levelId : undefined,
      countryCode: effectiveScope === 'country' ? user?.country : undefined,
      subjectId: effectiveScope === 'subject' ? subjectId : undefined,
    }).then((data) => {
      if (cancelled) return
      setLiveBoard(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [scope, subjectId, showThemePicker, user?.levelId, user?.country])

  const board = liveBoard ?? []
  const podium = board.slice(0, 3)
  const others = board.slice(3)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="text-brand" size={28} />
          </motion.div>
          Classement Elo
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">
          Basé sur les battles 1v1 · Elo initial: 400
        </p>
      </header>

      {/* Scopes */}
      <div className="overflow-x-auto -mx-4 px-4">
        <Tabs value={scope} onChange={(v) => { setScope(v); setShowThemePicker(false) }} tabs={SCOPES} size="sm" />
      </div>

      {/* Filtre supplémentaire : Thème (sur Monde) ou Pays */}
      {scope === 'world' && (
        <div>
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              showThemePicker
                ? 'bg-brand/10 text-brand'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles size={12} />
            {showThemePicker ? 'Filtrer par thème' : 'Filtrer par thème'}
          </button>

          {showThemePicker && (
            <motion.div
              className="flex flex-wrap gap-1.5 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <button
                onClick={() => setSubjectId('')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  !subjectId ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                Tous
              </button>
              {THEMES.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    onClick={() => setSubjectId(t.value)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      subjectId === t.value
                        ? 'bg-brand text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={11} />
                    {t.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {scope === 'country' && (
        <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5 font-medium">
          <Globe2 size={12} /> Pays : {getCountry(user?.country)?.name}
        </p>
      )}

      {scope === 'level' && (
        <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5 font-medium">
          Niveau : {levelShort(user?.levelId)}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Chargement...</span>
        </div>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent rounded-3xl blur-xl" />
          
          <div className="relative grid grid-cols-3 gap-2 items-end">
            {/* #2 */}
            {podium[1] && (
              <motion.div className="flex flex-col items-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 p-0.5 shadow-lg shadow-slate-400/30">
                    <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      <Avatar name={podium[1].name} avatarUrl={podium[1].avatarUrl} avatarSeed={podium[1].avatarSeed} size="md" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-black text-white">2</span>
                  </div>
                </div>
                <div className="mt-4 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <p className="font-display font-bold text-sm text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{podium[1].name}</p>
                    {user?.id && podium[1].id === user.id && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand/20 text-[9px] font-bold uppercase tracking-wider text-brand">Toi</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-brand">{podium[1].elo} Elo</p>
                  <p className="text-[10px] text-slate-400 capitalize">{podium[1].eloRank}</p>
                </div>
                <div className="mt-2 w-full h-16 bg-gradient-to-t from-slate-300/30 to-slate-300/10 rounded-t-xl" />
              </motion.div>
            )}

            {/* #1 */}
            {podium[0] && (
              <motion.div className="flex flex-col items-center -mt-4" initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <motion.div className="mb-1" animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Crown size={28} className="text-amber-400 fill-amber-400 drop-shadow-lg" />
                </motion.div>
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-3xl blur-lg opacity-40 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-xl shadow-amber-500/40">
                    <div className="w-full h-full rounded-[20px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      <Avatar name={podium[0].name} avatarUrl={podium[0].avatarUrl} avatarSeed={podium[0].avatarSeed} size="lg" />
                    </div>
                  </div>
                  <motion.div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg" whileHover={{ scale: 1.1 }}>
                    <span className="text-sm font-black text-white">#1</span>
                  </motion.div>
                </div>
                <div className="mt-5 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <p className="font-display font-black text-base text-slate-900 dark:text-white truncate max-w-[100px]">{podium[0].name}</p>
                    {user?.id && podium[0].id === user.id && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Toi</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Sparkles size={12} className="text-amber-500" />
                    <p className="text-sm font-black text-amber-500">{podium[0].elo} Elo</p>
                  </div>
                  <p className="text-[10px] text-amber-400/80 uppercase tracking-wider capitalize">{podium[0].eloRank}</p>
                </div>
                <div className="mt-2 w-full h-24 bg-gradient-to-t from-amber-400/30 to-amber-400/5 rounded-t-2xl" />
              </motion.div>
            )}

            {/* #3 */}
            {podium[2] && (
              <motion.div className="flex flex-col items-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 p-0.5 shadow-lg shadow-orange-400/30">
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      <Avatar name={podium[2].name} avatarUrl={podium[2].avatarUrl} avatarSeed={podium[2].avatarSeed} size="md" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-black text-white">3</span>
                  </div>
                </div>
                <div className="mt-4 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <p className="font-display font-bold text-sm text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{podium[2].name}</p>
                    {user?.id && podium[2].id === user.id && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand/20 text-[9px] font-bold uppercase tracking-wider text-brand">Toi</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-brand">{podium[2].elo} Elo</p>
                  <p className="text-[10px] text-slate-400 capitalize">{podium[2].eloRank}</p>
                </div>
                <div className="mt-2 w-full h-12 bg-gradient-to-t from-orange-400/30 to-orange-400/5 rounded-t-xl" />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      {others.length > 0 && (
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {others.map((row, index) => {
                const isMe = user?.id && row.id === user.id
                return (
                  <motion.li
                    key={row.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isMe ? 'bg-brand/5 dark:bg-brand/10' : ''
                    }`}
                  >
                    <div className="w-8 text-center font-display font-bold tabular-nums shrink-0 text-slate-400 text-sm">
                      {row.rank || index + 4}
                    </div>
                    <Avatar name={row.name} avatarUrl={row.avatarUrl} avatarSeed={row.avatarSeed} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-sm truncate flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        {row.name}
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand/20 text-[9px] font-bold uppercase tracking-wider text-brand">Toi</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        <Flag code={row.country} size="sm" /> {getCountry(row.country)?.name || row.country}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-wider capitalize">
                        {row.eloRank}
                      </div>
                      <div className="font-mono font-bold text-xs tabular-nums text-brand">{row.elo} Elo</div>
                      <div className="text-[10px] text-slate-400">{row.wins}V - {row.losses}D</div>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      {board.length === 0 && !loading && (
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardBody className="p-6 text-center">
            <Trophy size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-medium">
              {liveBoard === null
                ? 'Connecte-toi pour voir le classement'
                : 'Aucun joueur dans ce classement pour le moment.'}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
