// ─────────────────────────────────────────────────────────────────────────────
// Moteur XP — source de vérité unique.
// Règles anti-spam, pondération par niveau, multiplicateurs de mode.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. XP de base par bonne réponse (avant multiplicateurs) ──────────────────
const BASE_XP_PER_QUESTION = 10

// ── 2. Multiplicateur de niveau (difficulté du cours) ────────────────────────
// Plus le niveau est avancé, plus l'XP est élevée.
export const LEVEL_MULTIPLIER = {
  sixieme:   0.6,
  cinquieme: 0.7,
  quatrieme: 0.8,
  troisieme: 0.9,
  seconde:   1.0,
  premiere:  1.1,
  terminale: 1.2,
  prepa1:    1.5,
  prepa2:    1.7,
  licence1:  1.4,
  licence2:  1.5,
  licence3:  1.6,
  master1:   1.8,
  master2:   2.0,
}

// ── 3. Multiplicateur de mode ─────────────────────────────────────────────────
const MODE_MULTIPLIER = {
  solo:      1.0,
  challenge: 1.3,   // shuffle = plus dur
  '1v1':     1.5,   // compétitif
  '2v2':     1.4,
}

// ── 4. Bonus fixes (appliqués après le sous-total) ───────────────────────────
const BONUS = {
  perfect:    20,   // 100% de bonnes réponses
  speed:      12,   // temps restant > 50%
  battleWin:  15,   // gagner une battle
  streak3:    8,
  streak7:    18,
  streak30:   40,
}

// ── 5. Anti-spam : diminishing returns par cours ─────────────────────────────
// Chaque répétition du même cours réduit l'XP gagné.
// history = tableau des entrées précédentes.
const REPEAT_DECAY = [1.0, 0.6, 0.35, 0.15, 0.05]
// [1ère fois, 2e, 3e, 4e, 5e et au-delà → 5% seulement]

// ── 6. Bonus adversaire en battle (niveau de l'opposant) ─────────────────────
// Si l'adversaire a un niveau supérieur au tien, tu gagnes un bonus.
const OPPONENT_LEVEL_BONUS_PER_STEP = 0.08 // +8% par niveau d'écart

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le gain XP d'un quiz.
 *
 * @param {object} opts
 * @param {number}   opts.correctCount        bonnes réponses
 * @param {number}   opts.total               questions totales
 * @param {string}   opts.levelId             niveau du cours (ex: 'terminale')
 * @param {string}   opts.mode                'solo' | 'challenge' | '1v1' | '2v2'
 * @param {boolean}  opts.battleWin           a-t-on gagné la battle ?
 * @param {number}   opts.opponentLevelOrder  order du niveau adverse (battle seulement)
 * @param {number}   opts.myLevelOrder        order du niveau du joueur
 * @param {number}   opts.streakCount         streak actuel
 * @param {boolean}  opts.ranked
 * @param {number}   opts.timeRatio           0..1 proportion du temps restant
 * @param {string[]} opts.courseHistory       courseIds joués précédemment (anti-spam)
 * @param {string}   opts.courseId            courseId actuel
 *
 * @returns {{ total: number, breakdown: Record<string, number>, antiSpam: number }}
 */
export function computeXpGain({
  correctCount = 0,
  total = 1,
  levelId = 'seconde',
  mode = 'solo',
  battleWin = false,
  opponentLevelOrder = null,
  myLevelOrder = null,
  streakCount = 0,
  ranked = true,
  timeRatio = null,
  courseHistory = [],  // tableau de courseIds (chaînes)
  courseId = '',
}) {
  if (!ranked || correctCount === 0) return { total: 0, breakdown: {}, antiSpam: 1 }

  const breakdown = {}

  // ── a. Base : XP par bonne réponse × multiplicateur de niveau ────────────
  const levelMult  = LEVEL_MULTIPLIER[levelId] ?? 1.0
  const modeMult   = MODE_MULTIPLIER[mode]     ?? 1.0
  breakdown.questions = Math.round(correctCount * BASE_XP_PER_QUESTION * levelMult)

  // ── b. Bonus perfection ───────────────────────────────────────────────────
  if (correctCount === total && total > 0)
    breakdown.perfect = BONUS.perfect

  // ── c. Bonus rapidité ─────────────────────────────────────────────────────
  if (timeRatio !== null && timeRatio > 0.5)
    breakdown.speed = BONUS.speed

  // ── d. Bonus streak ───────────────────────────────────────────────────────
  if      (streakCount >= 30) breakdown.streak = BONUS.streak30
  else if (streakCount >= 7)  breakdown.streak = BONUS.streak7
  else if (streakCount >= 3)  breakdown.streak = BONUS.streak3

  // ── e. Bonus battle ───────────────────────────────────────────────────────
  if (mode === '1v1' || mode === '2v2') {
    if (battleWin) breakdown.battleWin = BONUS.battleWin

    // Bonus si l'adversaire est à un niveau supérieur
    if (opponentLevelOrder != null && myLevelOrder != null) {
      const levelGap = opponentLevelOrder - myLevelOrder
      if (levelGap > 0) {
        breakdown.opponentBonus = Math.round(
          breakdown.questions * Math.min(levelGap * OPPONENT_LEVEL_BONUS_PER_STEP, 0.5)
        )
      }
    }
  }

  // ── f. Sous-total avant multiplicateurs ──────────────────────────────────
  const subtotal = Object.values(breakdown).reduce((a, b) => a + b, 0)

  // ── g. Multiplicateur de mode ─────────────────────────────────────────────
  const afterMode = Math.round(subtotal * modeMult)
  if (modeMult !== 1.0) breakdown._modeBonus = afterMode - subtotal

  // ── h. Anti-spam : diminishing returns ───────────────────────────────────
  let repeatCount = 0
  if (courseId) {
    repeatCount = courseHistory.filter((id) => id === courseId).length
  }
  const decayIndex = Math.min(repeatCount, REPEAT_DECAY.length - 1)
  const antiSpam   = REPEAT_DECAY[decayIndex]
  const finalXp    = Math.max(1, Math.round(afterMode * antiSpam))

  if (antiSpam < 1) breakdown._antiSpam = Math.round(afterMode * antiSpam) - afterMode

  return { total: finalXp, breakdown, antiSpam }
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels humains pour afficher le breakdown dans l'UI
// ─────────────────────────────────────────────────────────────────────────────
export const XP_LABELS = {
  questions:     'Bonnes réponses',
  perfect:       'Quiz parfait',
  speed:         'Rapidité',
  streak:        'Streak actif',
  battleWin:     'Victoire',
  opponentBonus: 'Adversaire plus fort',
  _modeBonus:    'Bonus mode',
  _antiSpam:     'Répétition',
}

/**
 * Texte d'info affiché à l'utilisateur si anti-spam actif.
 */
export function getAntiSpamMessage(repeatCount) {
  if (repeatCount === 0) return null
  if (repeatCount === 1) return 'Déjà joué · XP réduit (-40%)'
  if (repeatCount === 2) return 'Déjà joué 2× · XP réduit (-65%)'
  if (repeatCount === 3) return 'Déjà joué 3× · XP réduit (-85%)'
  return 'Quiz déjà fait trop souvent · XP minimal (-95%)'
}
