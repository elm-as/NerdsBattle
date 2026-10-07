import { motion } from 'framer-motion'
import { ChevronRight, Swords, Target, TrendingUp, Trophy, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { formatEloChange, getRankByElo } from '../../lib/eloSystem.js'

export default function BattleResultsScreen({
  gameResult,
  myCorrect,
  total,
  myElo,
  opponentElo,
  isSolo,
  opponentName,
  onPlayAgain,
  onHome,
  onLeaderboard,
  maxPossible = 160,
}) {
  const { winner, isTie, myScore, oppScore, eloResult } = gameResult
  const myRank = getRankByElo(myElo)
  const oppRank = opponentElo ? getRankByElo(opponentElo) : null
  const scorePct = Math.round((myScore / maxPossible) * 100)

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-24 h-24 rounded-3xl mx-auto grid place-items-center shadow-2xl ${
            isSolo 
              ? 'bg-gradient-to-br from-brand to-violet-500 text-white' 
              : winner 
                ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' 
                : isTie 
                  ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white'
                  : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
          }`}
        >
          {isSolo ? <Target size={44} /> : winner ? <Trophy size={44} /> : isTie ? <Swords size={44} /> : <X size={44} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-3xl font-black">
            {isSolo 
              ? 'Quiz terminé !' 
              : winner 
                ? 'VICTOIRE !' 
                : isTie 
                  ? 'ÉGALITÉ' 
                  : 'Défaite...'}
          </h1>
          <p className="text-ink-mute text-sm mt-1 tabular-nums">
            {myCorrect}/{total} bonnes réponses · {scorePct}% de performance
          </p>
          <div className="mt-3 mx-auto max-w-[200px]">
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${scorePct >= 80 ? 'bg-emerald-500' : scorePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${scorePct}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-0.5 text-[10px] text-ink-mute tabular-nums">
              <span>{myScore} pts</span>
              <span>max {maxPossible} pts</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`bg-white dark:bg-canvas-surface rounded-2xl p-4 shadow-sm border-2 ${
            winner ? 'border-emerald-200 dark:border-emerald-800' : ''
          }`}>
            <div className="text-xs text-ink-mute mb-1">Toi</div>
            <div className="font-display text-3xl font-bold text-brand tabular-nums">{myScore}</div>
            <div className="text-[10px] text-ink-mute mt-1">{myRank?.name || 'Bronze'}</div>
          </div>
          {!isSolo && (
            <div className={`bg-white dark:bg-canvas-surface rounded-2xl p-4 shadow-sm border-2 ${
              !winner && !isTie ? 'border-rose-200 dark:border-rose-800' : ''
            }`}>
              <div className="text-xs text-ink-mute mb-1">{opponentName}</div>
              <div className="font-display text-3xl font-bold text-rose-500 tabular-nums">{oppScore}</div>
              <div className="text-[10px] text-ink-mute mt-1">{oppRank?.name || 'Bronze'}</div>
            </div>
          )}
        </motion.div>

        {eloResult && eloResult.change !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-display font-bold text-lg tabular-nums ${
              eloResult.change > 0 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <TrendingUp size={20} />
            {formatEloChange(eloResult.change)} Elo
            <span className="text-xs opacity-70 ml-1">({eloResult.newElo} total)</span>
          </motion.div>
        )}

        <motion.div 
          className="flex gap-3 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" onClick={onHome} className="flex-1">
            Accueil
          </Button>
          {!isSolo && (
            <Button variant="outline" onClick={onLeaderboard} className="flex-1">
              <Trophy size={16} /> Classement
            </Button>
          )}
          <Button onClick={onPlayAgain} className="flex-1">
            Rejouer <ChevronRight size={16} />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
