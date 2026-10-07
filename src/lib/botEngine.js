// Simulation d'adversaires IA pour les modes Battle.
// Aucune logique réseau — déterministe sur seed pour reproductibilité.

import { COUNTRIES } from '../data/countries.js'

const BOT_NAMES = [
  'Aïcha', 'Diego', 'Mei', 'Yuki', 'Liam', 'Fatou', 'Noé', 'Zoé',
  'Kofi', 'Inès', 'Hugo', 'Amir', 'Léa', 'Kenji', 'Sara', 'Jules',
  'Anna', 'Théo', 'Maya', 'Sami', 'Nora', 'Ezra', 'Ravi', 'Lina'
]

function rand() {
  return Math.random()
}

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

// Crée N adversaires bots avec un niveau de jeu (accuracy) variable
export function createBots(count, { skill = 'medium' } = {}) {
  const skillMap = { easy: 0.45, medium: 0.65, hard: 0.82 }
  const baseAccuracy = skillMap[skill] ?? 0.65
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${Date.now()}-${i}`,
    name: `${pick(BOT_NAMES)}${Math.floor(rand() * 99)}`,
    country: pick(COUNTRIES).code,
    avatarSeed: Math.random().toString(36).slice(2, 8),
    accuracy: Math.max(0.2, Math.min(0.95, baseAccuracy + (rand() - 0.5) * 0.2)),
    correct: 0,
    score: 0,
    answers: {}
  }))
}

// Pour une question donnée, le bot répond. Retourne { correct, answer }.
export function botAnswer(bot, question) {
  const isCorrect = rand() < bot.accuracy
  let answer
  switch (question.type) {
    case 'mcq': {
      if (isCorrect) {
        answer = question.answer
      } else {
        const wrong = question.options
          .map((_, i) => i)
          .filter((i) => i !== question.answer)
        answer = pick(wrong)
      }
      break
    }
    case 'truefalse': {
      answer = isCorrect ? question.answer : !question.answer
      break
    }
    case 'fill': {
      answer = isCorrect ? question.answer : '???'
      break
    }
    default:
      answer = null
  }
  return { correct: isCorrect, answer }
}

// Score équipe : moyenne des scores individuels
export function teamScore(team) {
  if (team.length === 0) return 0
  return Math.round(team.reduce((s, p) => s + (p.score || 0), 0) / team.length)
}

// Détermine le vainqueur entre deux équipes
export function decideWinner(teamA, teamB) {
  const a = teamScore(teamA)
  const b = teamScore(teamB)
  if (a > b) return 'A'
  if (b > a) return 'B'
  return 'tie'
}
