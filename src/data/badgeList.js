// Registre de tous les badges — source de vérité.
// check(state) : renvoie true si le badge est débloqué.
// `state` = { totalXp, streak, history, rank }

import {
  Flame, Zap, Trophy, Target, Star, Shield, Crown,
  BookOpen, Swords, Clock, Brain, Sparkles, Award, Gem
} from 'lucide-react'

export const BADGES = [
  // ─── Premiers pas ────────────────────────────────────────
  {
    id: 'first_quiz',
    label: 'Premier pas',
    desc: 'Termine ton premier quiz',
    icon: BookOpen,
    tone: 'brand',
    rarity: 'common',
    check: ({ history }) => history.length >= 1,
  },
  {
    id: 'five_quizzes',
    label: 'Assidu',
    desc: 'Termine 5 quiz',
    icon: Target,
    tone: 'brand',
    rarity: 'common',
    check: ({ history }) => history.length >= 5,
  },
  {
    id: 'twenty_quizzes',
    label: 'Vétéran',
    desc: 'Termine 20 quiz',
    icon: Shield,
    tone: 'slate',
    rarity: 'uncommon',
    check: ({ history }) => history.length >= 20,
  },
  {
    id: 'fifty_quizzes',
    label: 'Centurion',
    desc: 'Termine 50 quiz',
    icon: Award,
    tone: 'amber',
    rarity: 'rare',
    check: ({ history }) => history.length >= 50,
  },

  // ─── XP & Rangs ──────────────────────────────────────────
  {
    id: 'xp_100',
    label: 'Étincelle',
    desc: 'Atteins 100 XP',
    icon: Zap,
    tone: 'brand',
    rarity: 'common',
    check: ({ totalXp }) => totalXp >= 100,
  },
  {
    id: 'xp_500',
    label: 'En feu',
    desc: 'Atteins 500 XP',
    icon: Flame,
    tone: 'amber',
    rarity: 'uncommon',
    check: ({ totalXp }) => totalXp >= 500,
  },
  {
    id: 'xp_2000',
    label: 'Érudit en herbe',
    desc: 'Atteins 2 000 XP',
    icon: Star,
    tone: 'amber',
    rarity: 'uncommon',
    check: ({ totalXp }) => totalXp >= 2000,
  },
  {
    id: 'xp_10000',
    label: 'Élite',
    desc: 'Atteins 10 000 XP',
    icon: Crown,
    tone: 'brand',
    rarity: 'rare',
    check: ({ totalXp }) => totalXp >= 10000,
  },
  {
    id: 'xp_50000',
    label: 'Légendaire',
    desc: 'Atteins 50 000 XP',
    icon: Gem,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ totalXp }) => totalXp >= 50000,
  },

  // ─── Streak ──────────────────────────────────────────────
  {
    id: 'streak_3',
    label: '3 jours de suite',
    desc: 'Joue 3 jours consécutifs',
    icon: Flame,
    tone: 'amber',
    rarity: 'common',
    check: ({ streak }) => (streak?.count || 0) >= 3,
  },
  {
    id: 'streak_7',
    label: 'Semaine parfaite',
    desc: 'Joue 7 jours consécutifs',
    icon: Flame,
    tone: 'amber',
    rarity: 'uncommon',
    check: ({ streak }) => (streak?.count || 0) >= 7,
  },
  {
    id: 'streak_30',
    label: 'Mois en feu',
    desc: 'Joue 30 jours consécutifs',
    icon: Flame,
    tone: 'brand',
    rarity: 'rare',
    check: ({ streak }) => (streak?.count || 0) >= 30,
  },

  // ─── Performance ─────────────────────────────────────────
  {
    id: 'perfect_quiz',
    label: 'Sans faute',
    desc: 'Terminer un quiz avec 100% de bonnes réponses',
    icon: Sparkles,
    tone: 'brand',
    rarity: 'uncommon',
    check: ({ history }) => history.some((h) => h.accuracy >= 1 || h.correct === h.total),
  },
  {
    id: 'perfect_5',
    label: 'Imbattable',
    desc: '5 quiz parfaits',
    icon: Star,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) =>
      history.filter((h) => h.accuracy >= 1 || h.correct === h.total).length >= 5,
  },
  {
    id: 'accuracy_90',
    label: 'Précision',
    desc: 'Moyenne de précision ≥ 90% sur 10+ quiz',
    icon: Target,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) => {
      if (history.length < 10) return false
      const avg = history.reduce((s, h) => s + (h.accuracy || 0), 0) / history.length
      return avg >= 0.9
    },
  },

  // ─── Battle ──────────────────────────────────────────────
  {
    id: 'first_battle',
    label: 'Gladiateur',
    desc: 'Participe à ton premier battle',
    icon: Swords,
    tone: 'slate',
    rarity: 'common',
    check: ({ history }) => history.some((h) => h.mode === '1v1' || h.mode === '2v2'),
  },
  {
    id: 'battle_winner',
    label: 'Conquérant',
    desc: 'Gagne un battle',
    icon: Trophy,
    tone: 'amber',
    rarity: 'uncommon',
    check: ({ history }) => history.some((h) => (h.mode === '1v1' || h.mode === '2v2') && h.battleWin),
  },

  // ─── Vitesse ─────────────────────────────────────────────
  {
    id: 'speed_demon',
    label: 'Éclair',
    desc: 'Termine un quiz avec le bonus de rapidité',
    icon: Zap,
    tone: 'brand',
    rarity: 'uncommon',
    check: ({ history }) => history.some((h) => h.speedBonus),
  },

  // ─── Curiosité ───────────────────────────────────────────
  {
    id: 'three_subjects',
    label: 'Touche-à-tout',
    desc: 'Quiz dans 3 matières différentes',
    icon: Brain,
    tone: 'slate',
    rarity: 'common',
    check: ({ history }) => new Set(history.map((h) => h.subjectId)).size >= 3,
  },
  {
    id: 'all_subjects',
    label: 'Encyclopédiste',
    desc: 'Quiz dans toutes les matières',
    icon: BookOpen,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ history }) => new Set(history.map((h) => h.subjectId)).size >= 10,
  },
  {
    id: 'night_owl',
    label: 'Oiseau de nuit',
    desc: 'Termine un quiz après 23h',
    icon: Clock,
    tone: 'slate',
    rarity: 'common',
    check: ({ history }) =>
      history.some((h) => h.at && new Date(h.at).getHours() >= 23),
  },
  {
    id: 'early_bird',
    label: 'Lève-tôt',
    desc: 'Termine un quiz avant 7h du matin',
    icon: Zap,
    tone: 'amber',
    rarity: 'uncommon',
    check: ({ history }) =>
      history.some((h) => h.at && new Date(h.at).getHours() < 7),
  },

  // ─── Progression difficile ────────────────────────────
  {
    id: 'hundred_quizzes',
    label: 'Centurion',
    desc: 'Termine 100 quiz',
    icon: Shield,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) => history.length >= 100,
  },
  {
    id: 'five_hundred_quizzes',
    label: 'Immortel',
    desc: 'Termine 500 quiz',
    icon: Crown,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ history }) => history.length >= 500,
  },
  {
    id: 'streak_100',
    label: 'Centurion du feu',
    desc: 'Joue 100 jours consécutifs',
    icon: Flame,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ streak }) => (streak?.count || 0) >= 100,
  },
  {
    id: 'streak_365',
    label: 'Une année entière',
    desc: 'Joue 365 jours consécutifs',
    icon: Gem,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ streak }) => (streak?.count || 0) >= 365,
  },
  {
    id: 'max_rank',
    label: 'Légende absolue',
    desc: 'Atteins le rang Légende (60 000 XP)',
    icon: Crown,
    tone: 'amber',
    rarity: 'legendary',
    check: ({ totalXp }) => totalXp >= 60000,
  },
  {
    id: 'xp_100000',
    label: 'Au-delà des limites',
    desc: 'Atteins 100 000 XP',
    icon: Sparkles,
    tone: 'amber',
    rarity: 'legendary',
    check: ({ totalXp }) => totalXp >= 100000,
  },

  // ─── Domination ───────────────────────────────────────
  {
    id: 'perfect_10',
    label: 'Intouchable',
    desc: '10 quiz parfaits',
    icon: Star,
    tone: 'amber',
    rarity: 'legendary',
    check: ({ history }) =>
      history.filter((h) => h.accuracy >= 1 || h.correct === h.total).length >= 10,
  },
  {
    id: 'perfect_streak_5',
    label: 'Série parfaite',
    desc: '5 quiz parfaits consécutifs',
    icon: Sparkles,
    tone: 'brand',
    rarity: 'legendary',
    check: ({ history }) => {
      let streak = 0
      for (const h of history) {
        if (h.correct === h.total && h.total > 0) { streak++; if (streak >= 5) return true }
        else streak = 0
      }
      return false
    },
  },
  {
    id: 'battle_10wins',
    label: 'Gladiateur suprême',
    desc: 'Gagne 10 battles',
    icon: Swords,
    tone: 'amber',
    rarity: 'rare',
    check: ({ history }) =>
      history.filter((h) => (h.mode === '1v1' || h.mode === '2v2') && h.battleWin).length >= 10,
  },
  {
    id: 'speed_5',
    label: 'Flash',
    desc: 'Obtiens le bonus de rapidité 5 fois',
    icon: Zap,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) => history.filter((h) => h.speedBonus).length >= 5,
  },

  // ─── Polyvalence ─────────────────────────────────────
  {
    id: 'five_subjects_10',
    label: 'Polymathes',
    desc: '10+ quiz dans 5 matières différentes',
    icon: Brain,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) => {
      const counts = {}
      for (const h of history) counts[h.subjectId] = (counts[h.subjectId] || 0) + 1
      return Object.values(counts).filter((c) => c >= 10).length >= 5
    },
  },
  {
    id: 'accuracy_95_20',
    label: 'Chirurgien',
    desc: 'Précision ≥ 95% sur 20+ quiz',
    icon: Target,
    tone: 'amber',
    rarity: 'legendary',
    check: ({ history }) => {
      if (history.length < 20) return false
      const avg = history.reduce((s, h) => s + (h.accuracy || 0), 0) / history.length
      return avg >= 0.95
    },
  },
  {
    id: 'comeback',
    label: 'Comeback',
    desc: 'Quiz parfait après 3 échecs consécutifs (<50%)',
    icon: Sparkles,
    tone: 'brand',
    rarity: 'rare',
    check: ({ history }) => {
      let fails = 0
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i]
        if ((h.accuracy || 0) < 0.5) { fails++ }
        else if (fails >= 3 && (h.accuracy >= 1 || h.correct === h.total)) return true
        else fails = 0
      }
      return false
    },
  },
]
