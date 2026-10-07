import { BADGES } from './badgeList.js'

export { BADGES }

export const RARITY_STYLES = {
  common:    { label: 'Commun',    color: 'text-slate-500 dark:text-slate-400' },
  uncommon:  { label: 'Peu commun', color: 'text-emerald-600 dark:text-emerald-400' },
  rare:      { label: 'Rare',      color: 'text-blue-600 dark:text-blue-400' },
  legendary: { label: 'Légendaire', color: 'text-amber-500 dark:text-amber-400' },
}

/**
 * Calcule les badges débloqués et non-débloqués.
 * @param {Object} state - { totalXp, streak, history, rank }
 * @returns {{ unlocked: Array, locked: Array }}
 */
export function computeBadges(state) {
  const unlocked = []
  const locked = []
  for (const badge of BADGES) {
    try {
      if (badge.check(state)) unlocked.push(badge)
      else locked.push(badge)
    } catch {
      locked.push(badge)
    }
  }
  return { unlocked, locked }
}

/**
 * Retourne les badges nouvellement débloqués (comparaison avant/après).
 * @param {Object} stateBefore 
 * @param {Object} stateAfter 
 * @returns {Array} nouveaux badges
 */
export function getNewBadges(stateBefore, stateAfter) {
  const { unlocked: before } = computeBadges(stateBefore)
  const { unlocked: after }  = computeBadges(stateAfter)
  const beforeIds = new Set(before.map((b) => b.id))
  return after.filter((b) => !beforeIds.has(b.id))
}
