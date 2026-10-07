import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Timer, Trophy, Users, Zap, Swords, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { checkAnswer } from '../lib/quizEngine.js'
import Avatar from '../components/ui/Avatar.jsx'
import MathText from '../components/ui/MathText.jsx'
import { useBattleSession, BASE_POINTS, MAX_SPEED_BONUS, TIME_PER_QUESTION } from '../lib/useBattleSession.js'
import BattleWaitingScreen from '../components/battle/BattleWaitingScreen.jsx'
import BattleResultsScreen from '../components/battle/BattleResultsScreen.jsx'
import { FillInputInline, FillSubmitBar } from '../components/battle/BattleFillBar.jsx'

export default function BattleQuiz() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, submitQuiz, totalXp } = useUser()
  const { session, profile } = useAuth()

  const roomId = params.get('room')
  const myAvatar = user?.avatarUrl || profile?.avatar_url || session?.user?.user_metadata?.avatar_url || null

  const {
    questions,
    currentIndex,
    currentQ,
    myScore,
    myCorrect,
    opponentScore,
    opponentName,
    opponentAvatar,
    opponentAvatarSeed,
    opponentElo,
    timeLeft,
    gamePhase,
    gameResult,
    showFeedback,
    isSolo,
    myElo,
    handleAnswer,
    botEnabled,
  } = useBattleSession({ roomId, user, session, profile, submitQuiz, searchParams: params })

  const [fillValue, setFillValue] = useState('')

  useEffect(() => {
    setFillValue('')
  }, [currentIndex])

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-mute">Chargement du quiz...</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'waiting') {
    return (
      <BattleWaitingScreen
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentName}
        myCorrect={myCorrect}
        total={questions.length}
        isBot={botEnabled}
        maxPossible={questions.length * (BASE_POINTS + MAX_SPEED_BONUS)}
      />
    )
  }

  if (gamePhase === 'done' && gameResult) {
    return (
      <BattleResultsScreen
        gameResult={gameResult}
        myCorrect={myCorrect}
        total={questions.length}
        myElo={myElo}
        opponentElo={opponentElo}
        isSolo={isSolo}
        opponentName={opponentName}
        onHome={() => navigate('/')}
        onLeaderboard={() => navigate('/leaderboards')}
        onPlayAgain={() => navigate('/play')}
        maxPossible={questions.length * (BASE_POINTS + MAX_SPEED_BONUS)}
      />
    )
  }

  const timerRatio = timeLeft / TIME_PER_QUESTION
  const timerColor = timerRatio > 0.5 ? 'bg-brand' : timerRatio > 0.25 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col justify-between">
      {/* Barre supérieure : Joueurs & Scores */}
      <div className="shrink-0 px-4 pt-3 pb-2 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-canvas-surface rounded-2xl p-3 shadow-sm border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Avatar name={user?.name || 'Moi'} avatarUrl={myAvatar} avatarSeed={user?.avatarSeed} size="sm" />
            <div>
              <div className="text-xs font-semibold text-ink dark:text-slate-200">Toi</div>
              <div className="font-display font-bold text-base text-brand tabular-nums">{myScore} pts</div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-ink-mute mb-1 tabular-nums">
              <Timer size={14} />
              <span>{timeLeft}s</span>
            </div>
            <div className="w-24 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${timerColor} transition-all duration-300`}
                style={{ width: `${timerRatio * 100}%` }}
              />
            </div>
          </div>

          {!isSolo && (
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-xs font-semibold text-ink dark:text-slate-200">{opponentName}</div>
                <div className="font-display font-bold text-base text-rose-500 tabular-nums">{opponentScore} pts</div>
              </div>
              <Avatar name={opponentName} avatarUrl={opponentAvatar} avatarSeed={opponentAvatarSeed} size="sm" />
            </div>
          )}

          {isSolo && botEnabled && (
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-xs font-semibold text-ink dark:text-slate-200">{opponentName}</div>
                <div className="font-display font-bold text-base text-rose-500 tabular-nums">{opponentScore} pts</div>
              </div>
              <Avatar name={opponentName} avatarSeed={opponentAvatarSeed} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Zone question */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-2xl mx-auto w-full py-4">
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div
              key={currentQ.id || currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-canvas-surface rounded-3xl p-6 shadow-sm border border-black/5 dark:border-white/5 space-y-5"
            >
              <div className="flex items-center justify-between text-xs text-ink-mute">
                <span className="font-semibold uppercase tracking-wider text-[11px] px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">
                  Question {currentIndex + 1} / {questions.length}
                </span>
                <span className="font-mono text-brand font-bold tabular-nums">
                  +{BASE_POINTS}-{BASE_POINTS + MAX_SPEED_BONUS} pts
                </span>
              </div>

              <h2 className="font-display text-xl font-bold leading-snug">
                <MathText>{currentQ.prompt || currentQ.question || ''}</MathText>
              </h2>

              {/* Options QCM */}
              {currentQ.type === 'mcq' && currentQ.options?.map((option, idx) => {
                const optionLabel = typeof option === 'string' ? option : (option?.label || option?.text || '')
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx, checkAnswer({ ...currentQ, type: 'mcq' }, idx))}
                    className="w-full p-4 rounded-2xl border-2 border-black/10 dark:border-white/10 hover:border-brand hover:bg-brand/5 transition-all text-left flex items-center gap-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-brand/20 grid place-items-center text-xs font-bold text-brand shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-display font-medium text-sm flex-1">
                      <MathText>{optionLabel}</MathText>
                    </span>
                  </motion.button>
                )
              })}

              {/* True / False */}
              {currentQ.type === 'truefalse' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: true, label: 'Vrai', icon: Check, color: 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
                    { v: false, label: 'Faux', icon: X, color: 'hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' }
                  ].map((opt) => (
                    <motion.button
                      key={String(opt.v)}
                      onClick={() => handleAnswer(opt.v, checkAnswer(currentQ, opt.v))}
                      className={`h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-black/10 dark:border-white/10 transition-all ${opt.color}`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <opt.icon size={22} />
                      <span className="font-display font-semibold text-sm">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Fill Input */}
              {currentQ.type === 'fill' && (
                <FillInputInline currentQ={currentQ} onAnswer={setFillValue} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback d'animation lors de la réponse */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl font-display font-bold text-sm shadow-xl z-50 flex items-center gap-2 ${
                showFeedback.correct
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-rose-500/30'
              }`}
            >
              {showFeedback.correct ? <Check size={16} /> : <X size={16} />}
              <span className="tabular-nums">
                {showFeedback.correct ? `+${showFeedback.points} pts !` : '0 pt'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barre de validation pour type fill */}
      {currentQ?.type === 'fill' && (
        <FillSubmitBar
          value={fillValue}
          onChange={setFillValue}
          onSubmit={() => {
            const val = fillValue.trim()
            if (!val) return
            const correct = checkAnswer(currentQ, val)
            setFillValue('')
            handleAnswer(val, correct)
          }}
          timeLeft={timeLeft}
        />
      )}

      {currentQ?.type !== 'fill' && <div className="h-4 shrink-0" />}
    </div>
  )
}
