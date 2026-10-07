import { Award, Check, Crown, RotateCw, Sparkles, Star, Target, TrendingUp, Trophy, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import Confetti from '../components/quiz/Confetti.jsx'
import { getCourseById } from '../lib/contentLoader.js'
import { decideWinner, teamScore } from '../lib/botEngine.js'
import { getRankByXp } from '../data/ranks.js'
import { getAntiSpamMessage } from '../lib/xpEngine.js'

import BattleResultCard from '../components/results/BattleResultCard.jsx'
import QuestionCorrectionItem from '../components/results/QuestionCorrectionItem.jsx'
import XpBreakdownCard from '../components/results/XpBreakdownCard.jsx'
import ReportsSection from '../components/results/ReportsSection.jsx'
import RankUpCard from '../components/results/RankUpCard.jsx'

export default function Results() {
  const { courseId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { totalXp, history } = useUser()

  const course = getCourseById(courseId) || { title: state?.subjectTitle || 'Session NerdsBattle' }
  const result = state?.result
  const ranked = state?.ranked !== false
  const mode = state?.mode || 'solo'
  const isBattle = mode === '1v1' || mode === '2v2'
  const teamA = state?.teamA
  const teamB = state?.teamB
  const reports = state?.reports ?? []

  const winner = isBattle ? decideWinner(teamA, teamB) : null
  const scoreA = isBattle ? teamScore(teamA) : 0
  const scoreB = isBattle ? teamScore(teamB) : 0

  const xpGain = state?.xpGain ?? 0
  const breakdown = state?.breakdown ?? {}
  const repeatCount = history ? history.filter((h) => h.courseId === courseId).length - 1 : 0
  const antiSpamMsg = getAntiSpamMessage(Math.max(0, repeatCount))

  const rankUp = useMemo(() => {
    if (!ranked || !result) return null
    const before = (totalXp || 0) - xpGain
    const prev = getRankByXp(Math.max(0, before))
    const now = getRankByXp(totalXp || 0)
    return now.id !== prev.id ? { from: prev, to: now } : null
  }, [ranked, result, totalXp, xpGain])

  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!result) return
    let raf
    const start = performance.now()
    const duration = 800
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration)
      setAnimatedScore(Math.round(result.score * k))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [result])

  if (!result) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-mute">Aucun résultat à afficher.</p>
        <Link to="/" className="text-brand font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const perfect = result.correctCount === result.total
  const pct = Math.round(result.accuracy * 100)
  const youWin = isBattle && winner === 'A'

  return (
    <div className="space-y-4 pb-6">
      {(perfect || youWin || rankUp) && <Confetti />}

      <AnimatePresence>
        {isBattle && (
          <BattleResultCard
            teamA={teamA}
            teamB={teamB}
            scoreA={scoreA}
            scoreB={scoreB}
            winner={winner}
            eloChange={state?.eloChange}
            newElo={state?.newElo}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
          
          <CardBody className="relative text-center space-y-4 py-8">
            <div className="flex justify-center gap-2 flex-wrap">
              {perfect && (
                <motion.div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold text-xs"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Star size={14} fill="currentColor" /> SANS-FAUTE
                </motion.div>
              )}
              {pct >= 80 && !perfect && (
                <motion.div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/20 text-brand-300 font-bold text-xs"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Target size={14} /> EXCELLENT
                </motion.div>
              )}
            </div>

            <motion.div 
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-violet-500 grid place-items-center shadow-lg shadow-brand/30"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {perfect ? <Crown size={32} /> : <Trophy size={28} />}
            </motion.div>

            <div className="relative">
              <motion.div 
                className="font-display text-6xl font-black tabular-nums tracking-tight"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                {animatedScore}
                <span className="text-2xl text-slate-400">/100</span>
              </motion.div>
              
              <div className="mt-3 mx-auto max-w-[200px]">
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${
                      pct >= 80 ? 'bg-gradient-to-r from-brand to-emerald-400' :
                      pct >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                      'bg-gradient-to-r from-rose-400 to-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider tabular-nums">
                  <span>{result.correctCount} bonnes</span>
                  <span>{pct}% précision</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-sm tabular-nums">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check size={16} className="text-emerald-400" />
                <span className="font-bold">{result.correctCount}</span>
                <span className="text-slate-500">/{result.total}</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <X size={16} className="text-rose-400" />
                <span className="font-bold">{result.total - result.correctCount}</span>
                <span className="text-slate-500">erreurs</span>
              </div>
            </div>

            {ranked && xpGain > 0 && (
              <motion.div 
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand/20 to-violet-500/20 border border-brand/30"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Sparkles size={18} className="text-brand" />
                <span className="font-display font-bold text-lg tabular-nums">+{xpGain} XP</span>
              </motion.div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      <AnimatePresence>
        {rankUp && <RankUpCard from={rankUp.from} to={rankUp.to} />}
      </AnimatePresence>

      {ranked && xpGain > 0 && Object.keys(breakdown).length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <XpBreakdownCard breakdown={breakdown} xpGain={xpGain} antiSpamMsg={antiSpamMsg} />
        </motion.div>
      )}

      <RewardsSection perfect={perfect} pct={pct} ranked={ranked} />

      <section>
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
          <Award size={20} className="text-brand" />
          Analyse des réponses
        </h2>
        <div className="space-y-3">
          <AnimatePresence>
            {result.details.map((d, i) => (
              <motion.div
                key={d.question.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <QuestionCorrectionItem d={d} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {reports.length > 0 && (
        <ReportsSection reports={reports} session={session} />
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <motion.button
          onClick={() => navigate('/play')}
          className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-display font-bold flex items-center justify-center gap-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
          whileTap={{ scale: 0.98 }}
        >
          <RotateCw size={18} /> Rejouer
        </motion.button>
        <motion.button
          onClick={() => navigate('/leaderboards')}
          className="py-4 rounded-2xl bg-gradient-to-r from-brand to-violet-500 text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/25"
          whileTap={{ scale: 0.98 }}
        >
          <Trophy size={18} /> Classement
        </motion.button>
      </div>
    </div>
  )
}

function RewardsSection({ perfect, pct, ranked }) {
  const rewards = []
  if (perfect) {
    rewards.push({ icon: Star, label: 'Sans Faute', color: 'from-amber-400 to-yellow-500', desc: '100% de réussite' })
  } else if (pct >= 80) {
    rewards.push({ icon: Target, label: 'Expert', color: 'from-brand to-emerald-400', desc: '80%+ de précision' })
  } else if (pct >= 60) {
    rewards.push({ icon: TrendingUp, label: 'Progression', color: 'from-sky-400 to-blue-500', desc: '60%+ de précision' })
  }
  if (ranked) {
    rewards.push({ icon: Trophy, label: 'Ranked', color: 'from-violet-400 to-fuchsia-500', desc: 'Compte pour le classement' })
  }

  if (rewards.length === 0) return null

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="font-display font-bold text-sm mb-2 text-slate-500 uppercase tracking-wider">Récompenses</h3>
      <div className="grid grid-cols-2 gap-2">
        {rewards.map((reward, i) => (
          <motion.div
            key={reward.label}
            className={`p-3 rounded-xl bg-gradient-to-br ${reward.color} bg-opacity-10 border border-white/20`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center">
                <reward.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{reward.label}</p>
                <p className="text-[10px] text-white/80">{reward.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
