import { Swords } from 'lucide-react'

// Affiche les scores en parallèle pour les modes battle.
// teamA = joueur (+ allié éventuel), teamB = adversaires.
export default function BattleScoreboard({ teamA, teamB, mode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-canvas-surface border border-black/5 dark:border-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <Team players={teamA} side="left" />
        <div className="shrink-0 flex flex-col items-center text-ink-mute dark:text-slate-400">
          <Swords size={18} />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">
            {mode === '2v2' ? '2 vs 2' : '1 vs 1'}
          </span>
        </div>
        <Team players={teamB} side="right" />
      </div>
    </div>
  )
}

function Team({ players, side }) {
  return (
    <div className={`flex-1 flex ${side === 'right' ? 'flex-row-reverse' : ''} gap-2`}>
      {players.map((p) => (
        <Avatar key={p.id} player={p} side={side} />
      ))}
    </div>
  )
}

function Avatar({ player, side }) {
  const initial = (player.name?.[0] || '?').toUpperCase()
  const tone = player.isMe
    ? 'from-brand to-brand-lime'
    : side === 'left'
      ? 'from-emerald-500 to-teal-500'
      : 'from-rose-500 to-orange-500'
  return (
    <div className={`flex items-center gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tone} grid place-items-center text-white font-display font-bold text-sm`}
      >
        {initial}
      </div>
      <div className={`min-w-0 ${side === 'right' ? 'text-right' : ''}`}>
        <div className="font-display font-semibold text-xs truncate max-w-[70px]">
          {player.isMe ? 'Toi' : player.name}
        </div>
        <div className="font-mono text-sm font-bold tabular-nums">{player.score || 0}</div>
      </div>
    </div>
  )
}
