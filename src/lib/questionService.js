/**
 * Service de génération de questions via IA
 * Appelle l'Edge Function Supabase pour générer des questions.
 * 
 * V2 : Format robuste — conserve les indices de réponse intacts.
 * Supporte les deux formats : Edge Function (options strings) et legacy (options objets).
 */

import { supabase } from './supabase'

const DEFAULT_QUESTION_COUNT = 5

/**
 * Génère des questions de quiz pour un cours
 */
export async function generateQuestionsForCourse(course, courseContent = '', count = DEFAULT_QUESTION_COUNT) {
  if (!course || !course.id) {
    throw new Error('Cours invalide')
  }

  // 1. Vérifier le cache
  const cached = await getCachedQuestions(course.id)
  if (cached && cached.length >= count) {
    console.log('[questionService] Questions depuis le cache')
    return cached.slice(0, count)
  }

  try {
    console.log('[questionService] Génération IA pour:', course.title)

    const { data, error } = await supabase.functions.invoke('generate-questions', {
      body: {
        subjectId: course.subject || extractSubjectFromId(course.id),
        levelId: course.level || extractLevelFromId(course.id),
        questionCount: count,
        existingCourseLesson: courseContent || course.content || course.description || '',
        topic: course.title || ''
      }
    })

    if (error) {
      console.error('[questionService] Erreur Edge Function:', error)
      throw error
    }

    if (!data?.questions || data.questions.length === 0) {
      throw new Error('Aucune question générée')
    }

    // 3. Normaliser le format
    const formattedQuestions = normalizeQuestions(data.questions, course.id)

    // 4. Sauvegarder en cache
    await cacheQuestions(course.id, formattedQuestions)

    return formattedQuestions

  } catch (err) {
    console.error('[questionService] Erreur génération:', err)
    return generateGenericQuestions(course, count)
  }
}

/**
 * Normalise les questions dans un format unique utilisable par le client.
 * 
 * Formats acceptés en entrée (de l'Edge Function) :
 *   MCQ:  { type:'mcq', options:['A','B','C','D'], answer: 2 }
 *   TF:   { type:'truefalse', answer: true }
 *   Fill: { type:'fill', answer: 'paris' }
 * 
 * Format de sortie (utilisé par checkAnswer et les renderers) :
 *   MCQ:  { type:'mcq', options:['A','B','C','D'], answer: 2 }
 *   TF:   { type:'truefalse', answer: true }
 *   Fill: { type:'fill', answer: 'paris', acceptedAnswers: [...] }
 */
function normalizeQuestions(rawQuestions, courseId) {
  return rawQuestions.map((q, index) => {
    const base = {
      id: q.id || `q-${courseId}-${index}`,
      type: q.type || 'mcq',
      prompt: q.prompt || q.question || '',
      explanation: q.explanation || q.explication || '',
    }

    if (q.type === 'mcq' || (!q.type && q.options)) {
      // Normaliser les options en array de strings
      const options = normalizeOptions(q.options || q.choices || [])

      // Déterminer l'index de la réponse correcte
      let answerIndex = -1

      if (typeof q.answer === 'number' && Number.isInteger(q.answer)) {
        // Cas 1 : l'Edge Function renvoie un index numérique (format standard)
        if (q.answer >= 0 && q.answer < options.length) {
          answerIndex = q.answer
        }
      } else if (typeof q.answer === 'string') {
        // Cas 2 : l'answer est un string — soit un index, soit un label
        const num = Number(q.answer)
        if (Number.isInteger(num) && num >= 0 && num < options.length) {
          answerIndex = num
        } else {
          // Chercher le label dans les options
          answerIndex = options.findIndex(opt =>
            opt.toLowerCase().trim() === q.answer.toLowerCase().trim()
          )
        }
      }

      // Fallback : si toujours pas trouvé, utiliser 0 avec warning
      if (answerIndex < 0 || answerIndex >= options.length) {
        console.warn(`[questionService] Index de réponse invalide pour ${base.id}`, {
          answer: q.answer,
          options,
          answerIndex
        })
        answerIndex = 0
      }

      return {
        ...base,
        type: 'mcq',
        options,
        answer: answerIndex, // TOUJOURS un nombre
      }
    }

    if (q.type === 'truefalse') {
      const isTrue = q.answer === true || q.answer === 'true'
      const isFalse = q.answer === false || q.answer === 'false'
      return {
        ...base,
        type: 'truefalse',
        answer: isTrue ? true : (isFalse ? false : false),
      }
    }

    if (q.type === 'fill') {
      const answer = typeof q.answer === 'string' ? q.answer.trim() : String(q.answer || '').trim()
      // Collecter les variantes acceptées
      const acceptedAnswers = [
        ...(Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []),
        ...(Array.isArray(q.accepted_answers) ? q.accepted_answers : []),
        ...(Array.isArray(q.synonyms) ? q.synonyms : []),
      ].filter(Boolean)

      // Générer automatiquement des variantes si pas assez
      if (acceptedAnswers.length === 0 && answer) {
        acceptedAnswers.push(...generateAnswerVariants(answer))
      }

      return {
        ...base,
        type: 'fill',
        answer,
        acceptedAnswers,
      }
    }

    // Type inconnu — fallback MCQ
    return { ...base, type: 'mcq', options: [], answer: 0 }
  })
}

/**
 * Normalise les options en array de strings propre
 */
function normalizeOptions(opts) {
  if (!Array.isArray(opts)) return []
  return opts
    .map(o => {
      if (typeof o === 'string') return o.trim()
      if (o && typeof o === 'object') return (o.label || o.text || String(o)).trim()
      return String(o || '').trim()
    })
    .filter(o => o.length > 0)
}

/**
 * Génère des variantes de réponse (synonymes, sans accents, etc.)
 */
function generateAnswerVariants(answer) {
  if (!answer || typeof answer !== 'string') return []

  const normalized = answer.toLowerCase().trim()
  const variants = new Set([normalized])

  // Sans accents
  const noAccents = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  variants.add(noAccents)
  variants.add(noAccents.replace(/\s+/g, ''))

  // Avec/sans espaces, tirets, underscores
  variants.add(normalized.replace(/\s+/g, ''))
  variants.add(normalized.replace(/\s+/g, '-'))
  variants.add(normalized.replace(/\s+/g, '_'))

  // Singulier/pluriel
  if (normalized.endsWith('s')) {
    variants.add(normalized.slice(0, -1))
    variants.add(noAccents.endsWith('s') ? noAccents.slice(0, -1) : noAccents)
  } else {
    variants.add(normalized + 's')
    variants.add(noAccents + 's')
  }

  // Retirer l'original de la liste (déjà inclus dans answer)
  variants.delete(normalized)

  return Array.from(variants)
}

// ─── Cache ──────────────────────────────────────────────────────────────────────
async function getCachedQuestions(courseId) {
  try {
    const { data, error } = await supabase
      .from('generated_questions')
      .select('questions, generated_at')
      .eq('course_id', courseId)
      .single()

    if (error || !data) return null

    const generatedAt = new Date(data.generated_at)
    const now = new Date()
    if ((now.getTime() - generatedAt.getTime()) > 24 * 60 * 60 * 1000) {
      return null
    }

    return data.questions
  } catch {
    return null
  }
}

async function cacheQuestions(courseId, questions) {
  try {
    await supabase
      .from('generated_questions')
      .upsert({
        course_id: courseId,
        questions,
        generated_at: new Date().toISOString()
      }, { onConflict: 'course_id' })
  } catch { /* ok */ }
}

// ─── Fallback ───────────────────────────────────────────────────────────────────
function generateGenericQuestions(course, count) {
  const title = course.title || 'ce cours'
  const questions = []

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `generic-${i}`,
      type: 'mcq',
      prompt: `Question ${i + 1} sur "${title}"`,
      options: [
        'Le concept principal de cette leçon',
        'Une notion secondaire',
        'Une application pratique',
        'Un contre-exemple'
      ],
      answer: 0,
      explanation: `Consultez le cours "${title}" pour approfondir ce concept.`,
    })
  }

  return questions
}

function extractSubjectFromId(courseId) {
  if (!courseId) return 'maths'
  return courseId.split('-')[0] || 'maths'
}

function extractLevelFromId(courseId) {
  if (!courseId) return 'terminale'
  return courseId.split('-')[1] || 'terminale'
}
