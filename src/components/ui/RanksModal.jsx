import { X, Trophy } from 'lucide-react'
import { RANKS, TIERS, getRankByXp, getRankProgress } from '../../data/ranks.js'

const TIER_COLORS = {
  bronze:     'from-amber-700 to-orange-800',
  argent:     'from-slate-400 to-zinc-500',
  or:         'from-yellow-400 to-amber-500',
  emeraude:   'from-emerald-400 to-teal-600',
  violet:     'from-violet-500 to-fuchsia-600',
  legendaire: 'from-rose-500 to-orange-500',
}

export default function RanksModal({ xp = 0, onClose }) {
  const currentRank = getRankByXp(xp)
  const { ratio, xpNeeded } = getRankProgress(xp)

  const tierGroups = {}
  for (const r of RANKS) {
    if (!tierGroups[r.tier]) tierGroups[r.tier] = []
    tierGroups[r.tier].push(r)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — flex column avec header fixe + body scrollable */}
      <div
        className="relative z-10 w-full sm:max-w-md flex flex-col bg-canvas-light dark:bg-canvas-surface rounded-t-3xl sm:rounded-3xl max-h-[88vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header fixe ─────────────────────────────────── */}
        <div className="shrink-0 px-5 pt-5 pb-4 flex items-center justify-between border-b border-black/8 dark:border-white/8 bg-canvas-light dark:bg-canvas-surface rounded-t-3xl sm:rounded-t-3xl">
          <div>
            <h2 className="font-display text-xl font-bold">Tous les rangs</h2>
            <p className="text-xs text-ink-mute dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Trophy size={11} />
              {xp.toLocaleString('fr')} XP · Rang actuel :{' '}
              <span className="font-semibold text-ink dark:text-slate-200">{currentRank.name}</span>
              {xpNeeded > 0 && (
                <span className="text-brand font-semibold">· {xpNeeded.toLocaleString('fr')} XP restant</span>
              )}
            </p>
            {/* Mini progress bar */}
            <div className="mt-2 h-1.5 w-48 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-lime transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 grid place-items-center text-ink-mute hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body scrollable ──────────────────────────────── */}
        <div className="overflow-y-auto overscroll-contain p-5 space-y-5">
          {Object.entries(tierGroups).map(([tierId, ranks]) => {
            const tier = TIERS[tierId]
            const tierColor = TIER_COLORS[tierId]
            const tierUnlocked = ranks.some((r) => xp >= r.minXp)

            return (
              <section key={tierId}>
                {/* Tier header */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`h-px flex-1 bg-gradient-to-r ${tierColor} opacity-40`} />
                  <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColor} text-white`}>
                    {tier.name} · {tier.label}
                  </span>
                  <div className={`h-px flex-1 bg-gradient-to-l ${tierColor} opacity-40`} />
                </div>

                <div className="space-y-1.5">
                  {ranks.map((rank) => {
                    const Icon = rank.icon
                    const isCurrent = rank.id === currentRank.id
                    const isUnlocked = xp >= rank.minXp
                    const nextInAll = RANKS[RANKS.indexOf(rank) + 1]
                    const xpToNext = nextInAll ? nextInAll.minXp - xp : 0

                    return (
                      <div
                        key={rank.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                          isCurrent
                            ? 'ring-2 ring-brand/50 bg-brand/5 dark:bg-brand-dark/10'
                            : isUnlocked
                            ? 'bg-black/[0.03] dark:bg-white/[0.03]'
                            : 'opacity-35'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${rank.color} grid place-items-center text-white text-sm ${
                            isCurrent ? `ring-2 ${rank.ring} shadow-glow` : ''
                          } ${!isUnlocked ? 'grayscale' : ''}`}
                        >
                          <Icon size={18} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-sm">{rank.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-brand px-1.5 py-0.5 rounded-full">
                                Toi
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-mute dark:text-slate-400">
                            {rank.minXp === 0 ? 'Dès le départ' : `${rank.minXp.toLocaleString('fr')} XP`}
                            {isCurrent && nextInAll && (
                              <span className="ml-1.5 text-brand font-semibold">
                                · {xpToNext.toLocaleString('fr')} XP restant
                              </span>
                            )}
                          </div>
                        </div>
                        {isUnlocked && !isCurrent && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/15 grid place-items-center text-emerald-500 text-xs font-bold shrink-0">✓</span>
                        )}
                        {!isUnlocked && (
                          <span className="text-[11px] text-ink-mute dark:text-slate-500 font-mono shrink-0">
                            {(rank.minXp - xp).toLocaleString('fr')} XP
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
