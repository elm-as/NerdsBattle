// Système de rangs basés sur l'XP cumulée.
// Tiers progressifs : Bronze → Argent → Or → Émeraude → Violet → Légendaire.
// Pour ajouter un palier, pousser une entrée triée par minXp croissant.

import {
  Sprout, Leaf, BookOpen, Shield, Sparkles,
  Compass, Brain, GraduationCap, Award, Gem, Flame, Crown
} from 'lucide-react'

export const RANKS = [
  { id: 'novice',     name: 'Novice',     minXp: 0,     icon: Sprout,         tier: 'bronze',     color: 'from-stone-400 to-stone-600',      ring: 'ring-stone-400/30' },
  { id: 'apprenti',   name: 'Apprenti',   minXp: 100,   icon: Leaf,           tier: 'bronze',     color: 'from-amber-600 to-orange-700',     ring: 'ring-amber-600/30' },
  { id: 'eleve',      name: 'Élève',      minXp: 300,   icon: BookOpen,       tier: 'argent',     color: 'from-slate-300 to-slate-500',      ring: 'ring-slate-400/30' },
  { id: 'cadet',      name: 'Cadet',      minXp: 700,   icon: Shield,         tier: 'argent',     color: 'from-zinc-400 to-zinc-600',        ring: 'ring-zinc-400/30' },
  { id: 'initie',     name: 'Initié',     minXp: 1500,  icon: Sparkles,       tier: 'or',         color: 'from-yellow-400 to-amber-500',     ring: 'ring-amber-400/40' },
  { id: 'tacticien',  name: 'Tacticien',  minXp: 3000,  icon: Compass,        tier: 'or',         color: 'from-amber-400 to-yellow-600',     ring: 'ring-amber-400/40' },
  { id: 'stratege',   name: 'Stratège',   minXp: 5500,  icon: Brain,          tier: 'emeraude',   color: 'from-emerald-400 to-teal-600',     ring: 'ring-emerald-400/40' },
  { id: 'erudit',     name: 'Érudit',     minXp: 9000,  icon: GraduationCap,  tier: 'emeraude',   color: 'from-emerald-500 to-green-700',    ring: 'ring-emerald-500/40' },
  { id: 'maitre',     name: 'Maître',     minXp: 15000, icon: Award,          tier: 'violet',     color: 'from-violet-500 to-fuchsia-600',   ring: 'ring-violet-500/40' },
  { id: 'sage',       name: 'Sage',       minXp: 25000, icon: Gem,            tier: 'violet',     color: 'from-purple-500 to-indigo-600',    ring: 'ring-purple-500/40' },
  { id: 'oracle',     name: 'Oracle',     minXp: 40000, icon: Flame,          tier: 'legendaire', color: 'from-rose-500 to-orange-500',      ring: 'ring-rose-500/50' },
  { id: 'legende',    name: 'Légende',    minXp: 60000, icon: Crown,          tier: 'legendaire', color: 'from-amber-400 via-yellow-500 to-orange-600', ring: 'ring-amber-400/60' }
]

// Métadonnées des tiers (pour grouper visuellement si besoin)
export const TIERS = {
  bronze:     { name: 'Bronze',      label: 'Débutant' },
  argent:     { name: 'Argent',      label: 'Confirmé' },
  or:         { name: 'Or',          label: 'Avancé' },
  emeraude:   { name: 'Émeraude',    label: 'Expert' },
  violet:     { name: 'Violet',      label: 'Élite' },
  legendaire: { name: 'Légendaire',  label: 'Mythique' }
}

// Renvoie le rang correspondant à un nombre d'XP donné.
export function getRankByXp(xp = 0) {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r
    else break
  }
  return current
}

// Renvoie le rang suivant (ou null si max atteint).
export function getNextRank(xp = 0) {
  const current = getRankByXp(xp)
  const idx = RANKS.indexOf(current)
  return RANKS[idx + 1] ?? null
}

// Progression vers le prochain rang : { current, next, ratio (0..1), xpInLevel, xpNeeded }
export function getRankProgress(xp = 0) {
  const current = getRankByXp(xp)
  const next = getNextRank(xp)
  if (!next) {
    return { current, next: null, ratio: 1, xpInLevel: xp - current.minXp, xpNeeded: 0 }
  }
  const span = next.minXp - current.minXp
  const xpInLevel = xp - current.minXp
  const xpNeeded = next.minXp - xp
  return {
    current,
    next,
    ratio: Math.max(0, Math.min(1, xpInLevel / span)),
    xpInLevel,
    xpNeeded
  }
}

export const getRankById = (id) => RANKS.find((r) => r.id === id)
