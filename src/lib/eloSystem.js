/**
 * Système de classement Elo pour NerdsBattle
 * 
 * Inspiration : Elo des échecs, mais adapté pour du PvP temps réel
 * 
 * Principes :
 * - Défaite = perte de points, Victoire = gain de points
 * - Plus l'adversaire est fort (haut Elo), plus tu gagnes de points en cas de victoire
 * - Plus l'adversaire est faible, plus tu perds de points en cas de défaite
 * - K-factor : détermine la volatilité (combien de points échangés max)
 * - Protection minimum : pas d'Elo en dessous de 200
 */

// Elo minimum (jamais en dessous)
export const MIN_ELO = 200

// K-factor selon le rang (plus bas = moins volatile)
const K_FACTORS = {
  beginner: 50,    // 200-999 : K élevé pour monter rapidement
  intermediate: 35,  // 1000-1499
  advanced: 25,    // 1500-1999
  expert: 18,      // 2000-2499
  master: 12,      // 2500+
}

// Seuils de rangs Elo
const RANK_THRESHOLDS = [
  { id: 'bronze', name: 'Bronze', min: 200, max: 999, color: 'from-amber-700 to-amber-600' },
  { id: 'silver', name: 'Argent', min: 1000, max: 1499, color: 'from-slate-400 to-slate-300' },
  { id: 'gold', name: 'Or', min: 1500, max: 1999, color: 'from-amber-400 to-yellow-400' },
  { id: 'platinum', name: 'Platine', min: 2000, max: 2499, color: 'from-cyan-400 to-blue-400' },
  { id: 'diamond', name: 'Diamant', min: 2500, max: 2999, color: 'from-violet-400 to-purple-400' },
  { id: 'legend', name: 'Légende', min: 3000, max: Infinity, color: 'from-rose-500 to-pink-500' },
]

/**
 * Calcule le K-factor selon l'Elo actuel
 */
function getKFactor(elo) {
  if (elo < 1000) return K_FACTORS.beginner      // 200-999 : K=50
  if (elo < 1500) return K_FACTORS.intermediate  // 1000-1499 : K=35
  if (elo < 2000) return K_FACTORS.advanced      // 1500-1999 : K=25
  if (elo < 2500) return K_FACTORS.expert        // 2000-2499 : K=18
  return K_FACTORS.master                        // 2500+ : K=12
}

/**
 * Calcule le score attendu (probabilité de victoire)
 * @param {number} playerElo - Elo du joueur
 * @param {number} opponentElo - Elo de l'adversaire
 * @returns {number} Probabilité entre 0 et 1
 */
function expectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

/**
 * Calcule le changement d'Elo après un match
 * 
 * Améliorations :
 * - Minimum Elo : 200 (jamais en dessous)
 * - Victoire contre adversaire fort = gros gains
 * - Défaite contre adversaire faible = petites pertes
 * - Protection anti-farming : pas de gains contre adversaires trop faibles
 * 
 * @param {Object} params
 * @param {number} params.playerElo - Elo actuel du joueur
 * @param {number} params.opponentElo - Elo de l'adversaire
 * @param {boolean} params.won - true si victoire, false si défaite
 * @param {boolean} params.draw - true si match nul (optionnel)
 * @param {number} params.scoreDifference - Différence de score (bonus/malus)
 * @returns {Object} { newElo, change, playerExpected, opponentExpected }
 */
export function calculateEloChange({ playerElo, opponentElo, won, draw = false, scoreDifference = 0 }) {
  const k = getKFactor(playerElo)
  const expected = expectedScore(playerElo, opponentElo)
  const opponentExpected = expectedScore(opponentElo, playerElo)
  
  // Résultat : 1 = victoire, 0.5 = nul, 0 = défaite
  const actual = draw ? 0.5 : (won ? 1 : 0)
  
  // Bonus pour grande différence de score dans la partie (jusqu'à ±15 points)
  const scoreBonus = Math.max(-15, Math.min(15, scoreDifference * 1.5))
  
  // Calcul du changement de base
  let change = Math.round(k * (actual - expected) + scoreBonus)
  
  // Protection anti-farming : si adversaire a -400 Elo ou plus, gains réduits de 50%
  const eloDiff = playerElo - opponentElo
  if (won && eloDiff > 400) {
    change = Math.round(change * 0.5)  // Gains réduits
  }
  
  // Protection pour les joueurs faibles : pertes minimisées en dessous de 500 Elo
  if (!won && playerElo < 500) {
    change = Math.round(change * 0.7)  // Perte réduite de 30%
  }
  
  // Calcul du nouvel Elo avec protection MIN_ELO
  let newElo = playerElo + change
  
  // Bloquer à MIN_ELO (200) minimum
  if (newElo < MIN_ELO) {
    newElo = MIN_ELO
    // Recalculer le changement pour refléter la limitation
    change = newElo - playerElo
  }
  
  // S'assurer qu'on ne perd jamais de points si déjà au minimum
  if (playerElo <= MIN_ELO && change < 0) {
    change = 0
    newElo = MIN_ELO
  }
  
  return {
    newElo,
    change,
    expected: Math.round(expected * 100),  // En pourcentage
    opponentExpected: Math.round(opponentExpected * 100),
    kFactor: k
  }
}

/**
 * Récupère le rang correspondant à un Elo
 */
export function getRankByElo(elo) {
  return RANK_THRESHOLDS.find(r => elo >= r.min && elo < r.max) || RANK_THRESHOLDS[0]
}

/**
 * Formate l'affichage du changement d'Elo
 */
export function formatEloChange(change) {
  if (change > 0) return `+${change}`
  if (change < 0) return `${change}`
  return '=0'
}

/**
 * Détermine la couleur du changement
 */
export function getEloChangeColor(change) {
  if (change > 0) return 'text-emerald-500'
  if (change < 0) return 'text-rose-500'
  return 'text-slate-400'
}

/**
 * Calcule le streak bonus (win streak = plus de points)
 */
export function calculateStreakBonus(currentStreak) {
  if (currentStreak >= 10) return 15
  if (currentStreak >= 7) return 10
  if (currentStreak >= 5) return 5
  if (currentStreak >= 3) return 2
  return 0
}

/**
 * Streak malus (lose streak = plus de points perdus)
 */
export function calculateLoseStreakMalus(loseStreak) {
  if (loseStreak >= 5) return -10
  if (loseStreak >= 3) return -5
  return 0
}

// Elo initial pour nouveaux joueurs (commence à 400, dans Bronze)
export const INITIAL_ELO = 400

/**
 * Récupère le rang suivant (pour afficher la progression)
 */
export function getNextRank(elo) {
  const currentIndex = RANK_THRESHOLDS.findIndex(r => elo >= r.min && elo < r.max)
  if (currentIndex === -1) return null
  return RANK_THRESHOLDS[currentIndex + 1] || null
}

/**
 * Calcule la progression vers le rang suivant (0-100%)
 */
export function getEloProgress(elo) {
  const currentRank = getRankByElo(elo)
  if (!currentRank || currentRank.max === Infinity) return 100
  
  const range = currentRank.max - currentRank.min
  const progress = ((elo - currentRank.min) / range) * 100
  return Math.min(Math.max(progress, 0), 100)
}

// Export des seuils pour l'UI
export { RANK_THRESHOLDS }
