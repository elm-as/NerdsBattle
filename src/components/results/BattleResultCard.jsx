import { Crown, Frown, Minus, Swords } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardBody } from '../ui/Card.jsx'

export default function BattleResultCard({ teamA = [], teamB = [], scoreA = 0, scoreB = 0, winner, eloChange, newElo }) {
  const titleMap = {
    A: { title: 'VICTOIRE !', subtitle: 'Tu as gagné ce combat', icon: Crown, color: 'from-amber-400 via-yellow-500 to-amber-500', bg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10' },
    B: { title: 'DÉFAITE', subtitle: 'Reviens plus fort', icon: Frown, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
    tie: { title: 'ÉGALITÉ', subtitle: 'Match nul', icon: Minus, color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-900/20' }
  }
  const t = titleMap[winner] || titleMap.tie
  const Icon = t.icon

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`overflow-hidden border-0 ${t.bg}`}>
        <CardBody className="text-center space-y-4 py-6">
          <div className="space-y-1">
            <motion.div
              className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} grid place-items-center text-white shadow-lg`}
              animate={winner === 'A' ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon size={36} />
            </motion.div>
            <h2 className={`font-display text-3xl font-black ${winner === 'A' ? 'text-amber-500' : winner === 'B' ? 'text-slate-500' : 'text-sky-500'}`}>
              {t.title}
            </h2>
            <p className="text-sm text-slate-500">{t.subtitle}</p>
          </div>

          {(eloChange !== undefined && eloChange !== 0) && (
            <motion.div 
              className="flex items-center justify-center gap-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className={`px-4 py-2 rounded-xl font-display font-bold text-lg tabular-nums ${
                eloChange > 0 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
              }`}>
                {eloChange > 0 ? '+' : ''}{eloChange} Elo
              </div>
              {newElo && (
                <div className="text-sm text-slate-500 font-medium tabular-nums">
                  ({newElo} total)
                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-4">
            <div className={`text-center ${winner === 'A' ? 'scale-110' : 'opacity-60'}`}>
              <div className="font-display text-4xl font-black text-slate-800 dark:text-white tabular-nums">
                {scoreA}
              </div>
              <div className="flex gap-1 justify-center mt-1 flex-wrap">
                {teamA.map(p => (
                  <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-brand/20 text-brand font-bold">
                    {p.isMe ? 'Toi' : p.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center text-slate-400">
              <Swords size={24} />
              <span className="text-xs font-bold">VS</span>
            </div>

            <div className={`text-center ${winner === 'B' ? 'scale-110' : 'opacity-60'}`}>
              <div className="font-display text-4xl font-black text-slate-800 dark:text-white tabular-nums">
                {scoreB}
              </div>
              <div className="flex gap-1 justify-center mt-1 flex-wrap">
                {teamB.map(p => (
                  <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
