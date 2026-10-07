import { ChevronRight, Flame, Play, Sparkles, Target, Zap, Globe, Atom, Palette, Landmark, BookMarked, Microscope, Calculator, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { useUser } from '../context/UserContext.jsx'
import { getLevel } from '../data/levels.js'
import LiveStats from '../components/ui/LiveStats.jsx'
import { motion } from 'framer-motion'

const QUICK_SUBJECTS = [
  { id: 'maths', label: 'Maths', icon: Calculator, color: 'from-emerald-500 to-lime-500' },
  { id: 'physique', label: 'Physique', icon: Atom, color: 'from-sky-500 to-indigo-500' },
  { id: 'svt', label: 'SVT', icon: Microscope, color: 'from-green-500 to-teal-500' },
  { id: 'histoire', label: 'Histoire-Géo', icon: Landmark, color: 'from-amber-500 to-orange-500' },
  { id: 'francais', label: 'Français', icon: BookMarked, color: 'from-yellow-500 to-amber-500' },
  { id: 'anglais', label: 'Anglais', icon: Globe, color: 'from-rose-500 to-pink-500' },
]

export default function Home() {
  const { user, streak, totalXp, history } = useUser()
  const level = getLevel(user?.levelId)

  return (
    <div className="space-y-4">
      <LiveStats />
      
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-ink-mute dark:text-slate-400">Salut,</p>
          <h1 className="font-display text-2xl font-bold truncate">
            {user?.name || 'Champion'}
          </h1>
        </div>
        <span className="shrink-0 text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-mute">
          {level?.short}
        </span>
      </section>

      {/* CTA principal : JOUER */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Link to="/play" className="block group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 animate-pulse transition-all duration-500" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-800 shadow-2xl shadow-brand/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%2310B981%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M0%200h20v20H0z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
            
            <CardBody className="relative flex flex-row items-center gap-4 p-4">
              <motion.div 
                className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-brand via-violet-500 to-fuchsia-500 grid place-items-center text-white shadow-lg shadow-brand/30 relative overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                <Play size={32} fill="currentColor" className="relative z-10 drop-shadow-lg" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-black text-white tracking-tight">
                  JOUER
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-brand-300">Solo</span>
                  <span className="w-1 h-1 rounded-full bg-brand/50" />
                  <span className="text-xs font-semibold text-violet-300">Blitz</span>
                  <span className="w-1 h-1 rounded-full bg-brand/50" />
                  <span className="text-xs font-semibold text-fuchsia-300">1v1</span>
                </div>
              </div>
              
              <motion.div 
                className="flex w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm items-center justify-center text-white border border-white/20"
                whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <ChevronRight size={22} />
              </motion.div>
            </CardBody>
          </Card>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={<Flame size={16} />} label="Série" value={streak?.count || 0} tone="amber" />
        <StatCard icon={<Sparkles size={16} />} label="XP" value={totalXp || 0} tone="brand" />
        <StatCard icon={<Target size={16} />} label="Quiz" value={history?.length || 0} tone="slate" />
      </div>

      {/* Matières rapides */}
      <section>
        <header className="flex items-center justify-between mb-2.5">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Globe size={18} className="text-brand" />
            Matières au programme
          </h3>
          <Link to="/play" className="text-xs font-semibold text-brand">
            Tout voir
          </Link>
        </header>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_SUBJECTS.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.id}
                to={`/matchmaking?mode=solo&ranked=1&subject=${s.id}&level=${user?.levelId || 'seconde'}`}
              >
                <Card className="hover:border-brand/40 transition-all hover:-translate-y-0.5">
                  <CardBody className="p-3 text-center">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center text-white mx-auto mb-1.5`}>
                      <Icon size={16} />
                    </div>
                    <p className="font-display font-bold text-xs truncate">{s.label}</p>
                  </CardBody>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Lien classement */}
      <Link to="/leaderboards" className="block">
        <Card className="hover:border-brand/30 transition-colors">
          <CardBody className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 grid place-items-center text-white">
              <Trophy size={20} />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-sm">Classement Elo</div>
              <div className="text-[11px] text-ink-mute">Voir le classement mondial</div>
            </div>
            <ChevronRight size={16} className="text-ink-mute" />
          </CardBody>
        </Card>
      </Link>
    </div>
  )
}

function StatCard({ icon, label, value, tone }) {
  const tones = {
    amber: { bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10', text: 'text-amber-700 dark:text-amber-300', iconBg: 'bg-amber-500/25', shadow: 'shadow-amber-500/10', border: 'border-amber-500/20' },
    brand: { bg: 'bg-gradient-to-br from-brand/15 to-violet-500/10', text: 'text-brand-700 dark:text-brand-300', iconBg: 'bg-brand/25', shadow: 'shadow-brand/10', border: 'border-brand/20' },
    slate: { bg: 'bg-gradient-to-br from-slate-500/15 to-slate-400/10', text: 'text-slate-700 dark:text-slate-300', iconBg: 'bg-slate-500/25', shadow: 'shadow-slate-500/10', border: 'border-slate-500/20' }
  }
  const t = tones[tone]
  return (
    <motion.div 
      className={`relative rounded-xl ${t.bg} p-3 overflow-hidden border ${t.border} shadow-sm ${t.shadow}`}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${t.iconBg} blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
      <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${t.text}`}>
        <span className="p-1 rounded-md bg-white/50 dark:bg-black/20">{icon}</span>
        <span className="hidden sm:inline tracking-wide uppercase text-[10px]">{label}</span>
      </div>
      <div className="font-display text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
    </motion.div>
  )
}
