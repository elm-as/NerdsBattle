// Moteur de quiz — pure logic, zéro dépendance React.

const normalize = (s) =>
  String(s)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, ' ') // Normaliser espaces et tirets

/**
 * Vérifie si la réponse utilisateur correspond à la réponse attendue
 * Supporte les réponses alternatives et la tolérance aux variations
 */
export function checkAnswer(question, userAnswer) {
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false
  
  switch (question.type) {
    case 'mcq':
      return Number(userAnswer) === Number(question.answer)
    case 'truefalse':
      const userBool = userAnswer === true || userAnswer === 'true'
      const correctBool = question.answer === true || question.answer === 'true'
      return userBool === correctBool
    case 'fill':
      return checkFillAnswer(userAnswer, question.answer, question.acceptedAnswers)
    default:
      return false
  }
}

/**
 * Vérifie une réponse textuelle avec tolérance
 * @param {string} userAnswer - Réponse de l'utilisateur
 * @param {string} correctAnswer - Réponse attendue principale
 * @param {Array} acceptedAnswers - Réponses alternatives acceptées
 */
function checkFillAnswer(userAnswer, correctAnswer, acceptedAnswers = []) {
  const normalizedUser = normalize(userAnswer)
  
  // Réponse principale
  if (normalizedUser === normalize(correctAnswer)) return true
  
  // Réponses alternatives
  const allAccepted = [correctAnswer, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])]
  
  for (const accepted of allAccepted) {
    const normalizedAccepted = normalize(accepted)
    
    // Correspondance exacte
    if (normalizedUser === normalizedAccepted) return true
    
    // Correspondance partielle (si la réponse est courte < 20 caractères, exige plus de précision)
    if (normalizedAccepted.length < 20) {
      // Pour les mots courts, on accepte la correspondance exacte ou inclusion
      if (normalizedUser.includes(normalizedAccepted) || normalizedAccepted.includes(normalizedUser)) {
        return true
      }
    } else {
      // Pour les phrases longues, on accepte 80% de correspondance
      const similarity = calculateSimilarity(normalizedUser, normalizedAccepted)
      if (similarity > 0.8) return true
    }
  }
  
  return false
}

/**
 * Calcule la similarité entre deux chaînes (0 à 1)
 * Utilise la distance de Levenshtein simplifiée
 */
function calculateSimilarity(s1, s2) {
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0
  
  // Mots-clés communs
  const words1 = s1.split(' ').filter(w => w.length > 2)
  const words2 = s2.split(' ').filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) {
    // Si pas de mots significatifs, comparer caractère par caractère
    const common = [...s1].filter(c => s2.includes(c)).length
    return common / Math.max(s1.length, s2.length)
  }
  
  const commonWords = words1.filter(w => words2.includes(w))
  return commonWords.length / Math.max(words1.length, words2.length)
}

export function scoreQuiz(course, answers) {
  const questions = course?.questions || []
  if (questions.length === 0) {
    return { details: [], correctCount: 0, total: 0, accuracy: 0, score: 0 }
  }
  const details = questions.map((q) => {
    const userAnswer = answers?.[q?.id]
    const correct = checkAnswer(q, userAnswer)
    return { question: q, userAnswer, correct }
  })
  const correctCount = details.filter((d) => d.correct).length
  const total = questions.length
  const accuracy = total ? correctCount / total : 0
  // Score = précision sur 100 (sans bonus)
  const score = Math.round(accuracy * 100)
  // Bonus séparé pour les calculs XP
  const perfectBonus = correctCount === total ? 20 : 0
  return { details, correctCount, total, accuracy, score, perfectBonus }
}

// Mode révision : ne renvoie que les questions ratées
export function buildRevisionSet(course, prevDetails) {
  const questions = course?.questions || []
  if (!prevDetails || prevDetails.length === 0 || questions.length === 0) {
    return { ...course, title: `${course?.title || 'Cours'} — Révision`, questions: [] }
  }
  const wrongIds = new Set(prevDetails.filter((d) => !d.correct).map((d) => d?.question?.id).filter(Boolean))
  return {
    ...course,
    title: `${course.title} — Révision`,
    questions: questions.filter((q) => wrongIds.has(q.id))
  }
}

// Shuffle Fisher-Yates pour mode défi
export function shuffleQuestions(course) {
  const questions = course?.questions || []
  if (questions.length === 0) {
    console.warn('[quizEngine] Pas de questions à mélanger pour:', course?.title)
    return { ...course, questions: [] }
  }
  const arr = [...questions]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return { ...course, questions: arr }
}
