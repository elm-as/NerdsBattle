import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardBody } from '../ui/Card.jsx'

const XP_LABELS = {
  completion: 'Complétion du quiz',
  accuracy: 'Précision des réponses',
  timeBonus: 'Bonus de rapidité',
  perfectBonus: 'Bonus sans-faute',
  streakBonus: 'Bonus de série active',
  firstPlayBonus: 'Première partie du jour',
  battleWin: 'Victoire en battle',
  _penalty: 'Pénalité anti-spam',
}

export default function XpBreakdownCard({ breakdown = {}, xpGain = 0, antiSpamMsg }) {
  const [expanded, setExpanded] = useState(false)
  const entries = Object.entries(breakdown).filter(([, v]) => v !== 0)

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardBody className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand" />
            <span className="font-display font-bold">Détail XP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-brand tabular-nums">+{xpGain} XP</span>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                {entries.map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className={`${key.startsWith('_') ? 'text-rose-500' : 'text-slate-500'}`}>
                      {XP_LABELS[key] ?? key}
                    </span>
                    <span className={`font-mono font-bold tabular-nums ${val < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {val > 0 ? '+' : ''}{val}
                    </span>
                  </div>
                ))}
                {antiSpamMsg && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} />
                    {antiSpamMsg}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>
    </Card>
  )
}
