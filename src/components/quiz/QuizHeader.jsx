import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import ProgressBar from '../ui/ProgressBar.jsx'
import BattleScoreboard from './BattleScoreboard.jsx'

export default function QuizHeader({
  index,
  total,
  locked,
  timeLeft,
  timerSec,
  isBattle,
  teamA,
  teamB,
  mode,
  onQuit,
}) {
  return (
    <>
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={onQuit}
          className="flex-shrink-0 w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-700 grid place-items-center text-slate-500 hover:border-brand hover:text-brand transition-colors"
          aria-label="Quitter"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <ProgressBar value={index + (locked ? 1 : 0)} max={total} />
          <div className="flex justify-between mt-1 tabular-nums">
            <span className="text-[10px] font-bold text-slate-400">Question {index + 1}/{total}</span>
            {timerSec > 0 && !locked && (
              <span className={`text-[10px] font-bold ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                {timeLeft}s
              </span>
            )}
          </div>
        </div>
      </header>

      {timerSec > 0 && !locked && (
        <div className="mb-3">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-brand'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / timerSec) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {isBattle && (
        <div className="mb-3">
          <BattleScoreboard teamA={teamA} teamB={teamB} mode={mode} />
        </div>
      )}
    </>
  )
}
