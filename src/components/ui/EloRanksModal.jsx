import { ChevronRight, Lock, Trophy, Medal, Crown, Shield, Gem, Sparkles } from 'lucide-react'
import { RANK_THRESHOLDS } from '../../lib/eloSystem.js'

const RANK_ICONS = {
  bronze: Shield,
  silver: Medal,
  gold: Trophy,
  platinum: Gem,
  diamond: Sparkles,
  legend: Crown,
}

export default function EloRanksModal({ elo, eloRank, onClose }) {
  const currentRankIndex = RANK_THRESHOLDS.findIndex(r => r.id === eloRank)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white dark:bg-canvas-surface rounded-2xl shadow-2xl border border-black/5 dark:border-white/5">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Tous les rangs Elo</h2>
            <button 
              onClick={onClose} 
              aria-label="Fermer la modale"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <ChevronRight size={20} className="rotate-90" />
            </button>
          </div>

          <div className="space-y-3">
            {RANK_THRESHOLDS.map((rank, index) => {
              const isCurrent = index === currentRankIndex
              const isLocked = index > currentRankIndex
              const IconComponent = RANK_ICONS[rank.id] || Medal

              return (
                <div
                  key={rank.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent ? 'bg-brand/10 border-brand/30' :
                    isLocked ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${rank.color} grid place-items-center text-white shrink-0 shadow-sm`}>
                    <IconComponent size={18} />
                  </span>
                  <div className="flex-1">
                    <div className="font-display font-bold text-sm">{rank.name}</div>
                    <div className="text-xs text-ink-mute dark:text-slate-400 tabular-nums">
                      {rank.min === 200 ? 'Débutant' : `À partir de ${rank.min} Elo`}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-full">Ton rang</span>
                  )}
                  {isLocked && <Lock size={14} className="text-ink-mute dark:text-slate-500" />}
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-mute dark:text-slate-400">Ton Elo actuel</span>
              <span className="font-display font-bold text-brand tabular-nums">{elo}</span>
            </div>
            <p className="text-xs text-ink-mute dark:text-slate-500 mt-2">
              Gagne des battles pour monter en rang. Chaque victoire contre un adversaire fort te rapporte plus d'Elo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
