import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BattleWaitingScreen({ myScore, opponentScore, opponentName, myCorrect, total, isBot, maxPossible = 160 }) {
  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-violet-500 grid place-items-center text-white mx-auto mb-6 shadow-lg shadow-brand/25"
        >
          <Clock size={36} />
        </motion.div>
        
        <h1 className="font-display text-2xl font-bold mb-2">En attente...</h1>
        <p className="text-ink-mute mb-6">
          {isBot ? `${opponentName} réfléchit encore...` : `${opponentName} est encore en train de répondre`}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-canvas-surface rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-ink-mute mb-1">Ton score</div>
            <div className="font-display text-2xl font-bold text-brand tabular-nums">{myScore}</div>
            <div className="text-[10px] text-ink-mute mt-1 tabular-nums">{myCorrect}/{total} · max {maxPossible}</div>
          </div>
          <div className="bg-white dark:bg-canvas-surface rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-ink-mute mb-1">{opponentName}</div>
            <div className="font-display text-2xl font-bold text-rose-500 tabular-nums">{opponentScore}</div>
            <div className="text-xs text-ink-mute mt-1">En cours...</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-ink-mute">
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
