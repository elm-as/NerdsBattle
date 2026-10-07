// Stockage local MINIMAL - uniquement thème et cache questions IA
// Toutes les stats utilisateur sont sur Supabase
import { computeXpGain } from './xpEngine.js'

const THEME_KEY = 'nerdsbattle:theme'
const QUESTIONS_CACHE_KEY = 'nb:ai-questions' // sessionStorage pour questions IA temporaires

// ─── Thème ─────────────────────────────────────────────────────────
export function loadTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY)
    return theme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme === 'dark' ? 'dark' : 'light')
  } catch {}
}

// ─── Cache Questions IA (temporaire, session) ──────────────────────
export function getCachedQuestions() {
  try {
    const raw = sessionStorage.getItem(QUESTIONS_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Expire après 10 minutes
    if (Date.now() - (data.generatedAt || 0) > 10 * 60 * 1000) {
      sessionStorage.removeItem(QUESTIONS_CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCachedQuestions(data) {
  try {
    sessionStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data))
  } catch {}
}

export function clearCachedQuestions() {
  try {
    sessionStorage.removeItem(QUESTIONS_CACHE_KEY)
  } catch {}
}

const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function bumpStreak(currentStreak) {
  const t = today()
  if (currentStreak.lastDay === t) return currentStreak
  if (currentStreak.lastDay === yesterday()) return { count: currentStreak.count + 1, lastDay: t }
  return { count: 1, lastDay: t }
}

// Calcul XP pour un quiz - retourne les valeurs à sauvegarder sur Supabase
export function recordQuiz(state, entry) {
  const ranked = entry.ranked !== false
  const streak = ranked ? bumpStreak(state.streak) : state.streak

  // Calcul XP via le moteur centralisé
  const courseHistory = (state.history || []).map((h) => h.courseId).filter(Boolean)
  const { total: xpGain, breakdown, antiSpam } = computeXpGain({
    correctCount:       entry.correct        || 0,
    total:              entry.total          || 1,
    levelId:            entry.levelId        || 'seconde',
    mode:               entry.mode           || 'solo',
    battleWin:          !!entry.battleWin,
    opponentLevelOrder: entry.opponentLevelOrder ?? null,
    myLevelOrder:       entry.myLevelOrder       ?? null,
    streakCount:        streak.count,
    ranked,
    timeRatio:          entry.timeRatio      ?? null,
    courseId:           entry.courseId       || '',
    courseHistory,
  })

  const speedBonus = !!(breakdown.speed)
  
  // Créer l'entrée d'historique
  const historyEntry = {
    courseId: entry.courseId,
    subjectId: entry.subjectId,
    levelId: entry.levelId,
    mode: entry.mode || 'solo',
    ranked,
    speedBonus,
    battleWin: !!entry.battleWin,
    xpGain,
    score: entry.score || 0,
    accuracy: entry.accuracy || 0,
    correct: entry.correct || 0,
    total: entry.total || 0,
    at: Date.now()
  }

  const newHistory = [historyEntry, ...(state.history || [])].slice(0, 200)
  
  if (!ranked) {
    return { 
      ...state, 
      history: newHistory, 
      _lastXp: { xpGain: 0, breakdown: {}, antiSpam: 1 } 
    }
  }

  const newTotalXp = (state.totalXp || 0) + xpGain
  return { 
    ...state, 
    history: newHistory, 
    totalXp: newTotalXp, 
    streak, 
    _lastXp: { xpGain, breakdown, antiSpam } 
  }
}
