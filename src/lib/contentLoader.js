// Charge automatiquement tous les cours JSON via Vite glob.
// Ajoutez un fichier dans `src/data/courses/<subject>/<level>/*.json` —
// il est immédiatement disponible dans toute l'app.

import { SUBJECTS } from '../data/subjects.js'
import { LEVELS } from '../data/levels.js'

// Chargement des cours JSON via glob Vite
const allModules = import.meta.glob('/src/data/courses/**/*.json', { eager: true })

const subjectIds = new Set(SUBJECTS.map((s) => s.id))
const levelIds = new Set(LEVELS.map((l) => l.id))

function parsePath(path) {
  // path: /src/data/courses/<subject>/<level>/<slug>.json (depuis Vite glob)
  const m = path.match(/courses\/([^/]+)\/([^/]+)\/([^/]+)\.json$/)
  if (!m) {
    console.warn('[contentLoader] Chemin non reconnu:', path)
    return null
  }
  const [, subject, level, slug] = m
  if (!subjectIds.has(subject) || !levelIds.has(level)) {
    console.warn('[contentLoader] Subject ou level invalide:', { subject, level, path })
    return null
  }
  return { subject, level, slug }
}

// Debug: Afficher le nombre de modules trouvés
console.log('[contentLoader] Modules chargés:', Object.keys(allModules).length)
if (Object.keys(allModules).length === 0) {
  console.error('[contentLoader] ⚠️ Aucun cours trouvé! Vérifiez le chemin du glob.')
}

export const COURSES = Object.entries(allModules)
  .map(([path, mod]) => {
    const meta = parsePath(path)
    if (!meta) return null
    const data = mod.default ?? mod
    return {
      ...data,
      id: data.id ?? `${meta.subject}-${meta.level}-${meta.slug}`,
      slug: meta.slug,
      subjectId: meta.subject,
      levelId: meta.level,
      questionCount: data.questions?.length ?? 0
    }
  })
  .filter(Boolean)

export const getCourseById = (id) => COURSES.find((c) => c.id === id)

export const getCourses = ({ subjectId, levelId } = {}) =>
  COURSES.filter(
    (c) =>
      (!subjectId || c.subjectId === subjectId) &&
      (!levelId || c.levelId === levelId)
  )

export const getCoursesGroupedBySubject = (levelId) => {
  const grouped = {}
  for (const s of SUBJECTS) {
    grouped[s.id] = COURSES.filter(
      (c) => c.subjectId === s.id && (!levelId || c.levelId === levelId)
    )
  }
  return grouped
}

const TOPIC_TO_SUBJECT = {
  maths: 'maths',
  mathematiques: 'maths',
  histoire: 'histoire',
  geographie: 'histoire',
  sciences: 'physique',
  physique: 'physique',
  chimie: 'physique',
  svt: 'svt',
  nature: 'svt',
  technologie: 'info',
  info: 'info',
  informatique: 'info',
  francais: 'francais',
  anglais: 'anglais',
  philosophie: 'philosophie',
  philo: 'philosophie',
  allemand: 'allemand',
  espagnol: 'espagnol'
}

/**
 * Pioche des questions aléatoires depuis la banque locale officielle (1 120+ cours)
 * Permet aux modes Quiz Solo, Blitz et PvP de cibler fidèlement la bonne matière demandée.
 */
export function getRandomQuestionsFromCourses({ subjectId, levelId, count = 8, topic } = {}) {
  // 1. Résoudre la vraie matière ciblée
  let targetSubject = subjectId
  if (topic && TOPIC_TO_SUBJECT[topic.toLowerCase()]) {
    targetSubject = TOPIC_TO_SUBJECT[topic.toLowerCase()]
  }

  // 2. Filtrer les cours pertinents
  let relevantCourses = []

  if (targetSubject && targetSubject !== 'culture_generale') {
    // Matière spécifique demandée (maths, physique, histoire, etc.)
    relevantCourses = COURSES.filter((c) => {
      const matchSubject = c.subjectId === targetSubject
      const matchLevel = !levelId || c.levelId === levelId
      return matchSubject && matchLevel && Array.isArray(c.questions) && c.questions.length > 0
    })

    // Si aucun cours trouvé pour ce niveau spécifique, élargir à tous les niveaux de cette matière
    if (relevantCourses.length === 0) {
      relevantCourses = COURSES.filter(
        (c) => c.subjectId === targetSubject && Array.isArray(c.questions) && c.questions.length > 0
      )
    }
  } else {
    // Mode Culture Générale ou Mixte : piocher un équilibre dans TOUTES les matières du niveau !
    relevantCourses = COURSES.filter((c) => {
      const matchLevel = !levelId || c.levelId === levelId
      return matchLevel && Array.isArray(c.questions) && c.questions.length > 0
    })

    if (relevantCourses.length === 0) {
      relevantCourses = COURSES.filter((c) => Array.isArray(c.questions) && c.questions.length > 0)
    }
  }

// Filtre les questions "méta" ou polluées issues de résumés de manuels (ex: pages, numéros de chapitres, métadonnées)
function isCleanQuizQuestion(q) {
  if (!q || !q.prompt || typeof q.prompt !== 'string') return false
  const p = q.prompt.toLowerCase()
  if (
    p.match(/\bpage\s+0?\d+/i) ||
    p.match(/numéro de page/i) ||
    p.match(/quel chapitre/i) ||
    p.match(/\bchapitre\s+\d+/i) ||
    p.match(/\bmodule\s+\d+/i) ||
    p.match(/projet de consolidation/i) ||
    p.match(/(le|ce|du|dans le)\s+manuel/i) ||
    p.match(/dans la partie\s+\d+/i) ||
    p.match(/format json/i) ||
    p.match(/estimatedminutes/i)
  ) {
    return false
  }
  if (
    Array.isArray(q.options) &&
    q.options.some((opt) => typeof opt === 'string' && opt.match(/^(chapitre|module)\s+\d+/i))
  ) {
    return false
  }
  return true
}

  // 3. Extraire toutes les questions valides
  const allQuestions = []
  for (const course of relevantCourses) {
    for (const q of course.questions) {
      if (q && q.prompt && (Array.isArray(q.options) || q.type === 'truefalse' || q.type === 'fill')) {
        if (isCleanQuizQuestion(q)) {
          allQuestions.push({
            ...q,
            subject: course.subjectId,
            level: course.levelId,
            courseTitle: course.title,
          })
        }
      }
    }
  }

  // Helper de mélange Fisher-Yates
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
  }

  // 4. Si mode Mixte / Culture Générale : garantir un équilibre parfait entre les matières
  if (targetSubject === 'culture_generale' || !targetSubject) {
    const bySubject = {}
    for (const q of allQuestions) {
      if (!bySubject[q.subject]) bySubject[q.subject] = []
      bySubject[q.subject].push(q)
    }

    for (const s of Object.keys(bySubject)) {
      shuffle(bySubject[s])
    }

    const mixed = []
    const subjectList = Object.keys(bySubject)
    let round = 0
    while (mixed.length < count && mixed.length < allQuestions.length) {
      const s = subjectList[round % subjectList.length]
      if (bySubject[s] && bySubject[s].length > 0) {
        mixed.push(bySubject[s].pop())
      }
      round++
    }

    return shuffle(mixed).slice(0, count)
  }

  // 5. Matière unique ciblée : mélange direct
  shuffle(allQuestions)
  return allQuestions.slice(0, count)
}
