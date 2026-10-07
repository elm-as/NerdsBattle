import { getRankByXp } from '../../data/ranks.js'

// Affichage compact ou complet d'un rang.
// size: 'xs' | 'sm' | 'md' | 'lg'
// showLabel: affiche le nom du rang à côté
export default function RankBadge({ xp = 0, rank, size = 'md', showLabel = true, className = '' }) {
  const r = rank || getRankByXp(xp)
  const Icon = r.icon

  const sizes = {
    xs: { box: 'w-6 h-6', icon: 12, text: 'text-[10px]', radius: 'rounded-xl' },
    sm: { box: 'w-8 h-8', icon: 16, text: 'text-xs', radius: 'rounded-xl' },
    md: { box: 'w-10 h-10', icon: 20, text: 'text-sm', radius: 'rounded-2xl' },
    lg: { box: 'w-14 h-14', icon: 28, text: 'text-base', radius: 'rounded-3xl' }
  }
  const s = sizes[size]

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`shrink-0 ${s.box} ${s.radius} bg-gradient-to-br ${r.color} grid place-items-center text-white ring-2 ${r.ring} shadow-md relative overflow-hidden`}
        aria-label={`Rang : ${r.name}`}
      >
        {/* Glow effect for high tiers */}
        {(r.tier === 'violet' || r.tier === 'legendaire') && (
          <div className="absolute inset-0 bg-white/20 blur-md pointer-events-none" />
        )}
        <Icon size={s.icon} className="relative z-10 drop-shadow-md" />
      </span>
      {showLabel && (
        <span className={`font-display font-bold ${s.text} truncate`}>{r.name}</span>
      )}
    </div>
  )
}
