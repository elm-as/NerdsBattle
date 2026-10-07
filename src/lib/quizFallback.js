/**
 * Questions de fallback génériques quand le cours n'a pas de questions intégrées
 * @param {Object} course 
 * @param {number} count 
 * @returns {Array} questions
 */
export function generateGenericFallbackQuestions(course, count = 5) {
  const title = course?.title || 'Ce cours'
  const questions = []
  
  for (let i = 0; i < count; i++) {
    questions.push({
      id: `fallback-${i}`,
      type: 'mcq',
      prompt: `Question ${i + 1} sur "${title}" : Quel concept important est abordé dans cette leçon ?`,
      options: [
        { id: '0', label: 'Concept fondamental du cours' },
        { id: '1', label: 'Méthode ou technique clé' },
        { id: '2', label: 'Application pratique' },
        { id: '3', label: 'Exemple illustratif' }
      ],
      answer: '0',
      explanation: `Pour répondre correctement, relisez attentivement la section "${title}" de votre cours et identifiez les concepts principaux présentés.`,
    })
  }
  
  return questions
}
