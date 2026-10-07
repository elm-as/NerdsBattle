#!/usr/bin/env node
/**
 * Génère de nouvelles questions pour un cours JSON existant via DeepSeek.
 *
 * Usage :
 *   node scripts/generate-quiz.mjs <courseId> [--count=8] [--append]
 *
 * Exemples :
 *   node scripts/generate-quiz.mjs maths-master1-integration
 *   node scripts/generate-quiz.mjs maths-master1-integration --count=10
 *   node scripts/generate-quiz.mjs maths-master1-integration --count=4 --append
 *
 * Options :
 *   --count=N   Nombre de questions à générer (défaut : 6)
 *   --append    Ajoute les nouvelles questions au cours existant (sinon remplace)
 *   --dry-run   Affiche le prompt sans appeler l'API
 *
 * Variables d'environnement (.env) :
 *   API_KEY       Clé DeepSeek (obligatoire)
 *   API_BASE_URL  https://api.deepseek.com/v1  (défaut)
 *   API_MODEL     deepseek-chat                (défaut)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Chargement du .env ───────────────────────────────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
try {
  const env = readFileSync(join(root, '.env'), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* .env optionnel */ }

const API_KEY      = process.env.API_KEY
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.deepseek.com/v1'
const API_MODEL    = process.env.API_MODEL    || 'deepseek-chat'

// ─── Args ─────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2)
const courseId = args.find((a) => !a.startsWith('--'))
const count    = parseInt(args.find((a) => a.startsWith('--count='))?.split('=')[1] || '6', 10)
const append   = args.includes('--append')
const dryRun   = args.includes('--dry-run')

if (!courseId) {
  console.error('Usage: node scripts/generate-quiz.mjs <courseId> [--count=N] [--append] [--dry-run]')
  console.error('\nCours disponibles :')
  listCourses(join(root, 'src', 'data', 'courses')).forEach((id) => console.error('  ', id))
  process.exit(1)
}

if (!API_KEY && !dryRun) {
  console.error('❌  API_KEY manquante. Ajoute-la dans .env :')
  console.error('   API_KEY=sk-...')
  console.error('   API_BASE_URL=https://api.deepseek.com/v1')
  process.exit(1)
}

// ─── Trouver le fichier du cours ──────────────────────────────────────────────
const coursesDir = join(root, 'src', 'data', 'courses')
const courseFile = findCourseFile(coursesDir, courseId)
if (!courseFile) {
  console.error(`❌  Cours introuvable : "${courseId}"`)
  console.error('\nCours disponibles :')
  listCourses(coursesDir).forEach((id) => console.error('  ', id))
  process.exit(1)
}

const course = JSON.parse(readFileSync(courseFile, 'utf8'))
console.log(`\n📖  Cours : ${course.title}`)
console.log(`   Niveau : ${course.id}`)
console.log(`   ${course.questions?.length ?? 0} questions existantes`)

// ─── Prompt ───────────────────────────────────────────────────────────────────
const existingPrompts = (course.questions || [])
  .map((q) => `- ${q.prompt}`)
  .join('\n')

const SYSTEM = `Tu es un expert pédagogique francophone. Tu génères des questions de quiz rigoureuses et variées pour des étudiants.
Pour les formules mathématiques, utilise la notation LaTeX inline ($...$) ou bloc ($$...$$).
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte hors du JSON.`

const USER = `Voici un cours intitulé "${course.title}" (niveau : ${course.id}) :

--- LEÇON ---
${course.lesson}
--- FIN LEÇON ---

Questions déjà existantes (NE PAS dupliquer) :
${existingPrompts || '(aucune)'}

Génère exactement ${count} NOUVELLES questions variées et difficiles basées UNIQUEMENT sur le contenu de cette leçon.
Mix obligatoire : au moins 1 "mcq", 1 "truefalse", 1 "fill". Les questions mcq doivent avoir 4 options plausibles.
Pour les niveaux supérieurs (licence, master, prépa), les questions doivent tester la compréhension profonde, pas la mémorisation.

Format JSON attendu (tableau uniquement) :
{
  "questions": [
    { "id": "q1", "type": "mcq", "prompt": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..." },
    { "id": "q2", "type": "truefalse", "prompt": "...", "answer": true, "explanation": "..." },
    { "id": "q3", "type": "fill", "prompt": "...", "answer": "...", "explanation": "..." }
  ]
}`

if (dryRun) {
  console.log('\n=== SYSTEM ===\n', SYSTEM)
  console.log('\n=== USER ===\n', USER)
  process.exit(0)
}

// ─── Appel API ────────────────────────────────────────────────────────────────
console.log(`\n🤖  Appel DeepSeek (${API_MODEL}) — ${count} questions…`)

let raw
try {
  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: API_MODEL,
      temperature: 0.75,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: USER }
      ]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`❌  Erreur API (${res.status}) :`, err)
    process.exit(1)
  }

  const json = await res.json()
  raw = json.choices?.[0]?.message?.content
  if (!raw) throw new Error('Réponse vide du modèle')
} catch (e) {
  console.error('❌  Erreur réseau :', e.message)
  process.exit(1)
}

// ─── Parse & validation ───────────────────────────────────────────────────────
let parsed
try {
  parsed = JSON.parse(raw)
} catch {
  const m = raw.match(/\{[\s\S]+\}/)
  if (!m) { console.error('❌  JSON introuvable dans la réponse.'); process.exit(1) }
  try { parsed = JSON.parse(m[0]) } catch { console.error('❌  JSON non parseable.'); process.exit(1) }
}

const rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions ?? [])
if (!rawQuestions.length) {
  console.error('❌  Aucune question dans la réponse du modèle.')
  console.error('Réponse brute :', raw.slice(0, 600))
  process.exit(1)
}

// Validation et renommage des IDs
const existingCount = append ? (course.questions?.length ?? 0) : 0
const ALLOWED = new Set(['mcq', 'truefalse', 'fill'])
const validated = []
const errors = []

for (let i = 0; i < rawQuestions.length; i++) {
  const q = rawQuestions[i]
  const prefix = `[${i}]`
  if (!q || typeof q !== 'object') { errors.push(`${prefix} n'est pas un objet`); continue }
  if (!ALLOWED.has(q.type)) { errors.push(`${prefix} type invalide : ${q.type}`); continue }
  if (typeof q.prompt !== 'string' || !q.prompt.trim()) { errors.push(`${prefix} prompt manquant`); continue }

  const base = {
    id: `q${existingCount + validated.length + 1}`,
    type: q.type,
    prompt: q.prompt.trim(),
    explanation: (q.explanation || '').trim()
  }

  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) { errors.push(`${prefix} options invalides`); continue }
    const ans = Number(q.answer)
    if (!Number.isInteger(ans) || ans < 0 || ans >= q.options.length) { errors.push(`${prefix} answer hors bornes`); continue }
    validated.push({ ...base, options: q.options.map(String), answer: ans })
  } else if (q.type === 'truefalse') {
    if (typeof q.answer !== 'boolean') { errors.push(`${prefix} answer doit être booléen`); continue }
    validated.push({ ...base, answer: q.answer })
  } else if (q.type === 'fill') {
    if (typeof q.answer !== 'string' || !q.answer.trim()) { errors.push(`${prefix} answer manquant`); continue }
    validated.push({ ...base, answer: q.answer.trim() })
  }
}

if (errors.length) {
  console.warn(`\n⚠️   ${errors.length} question(s) ignorée(s) :`)
  errors.forEach((e) => console.warn('   -', e))
}

if (!validated.length) {
  console.error('❌  Aucune question valide générée.')
  process.exit(1)
}

// ─── Écriture ─────────────────────────────────────────────────────────────────
const updatedCourse = {
  ...course,
  questions: append
    ? [...(course.questions || []), ...validated]
    : validated
}

writeFileSync(courseFile, JSON.stringify(updatedCourse, null, 2) + '\n', 'utf8')

const action = append ? 'ajoutées au cours' : 'remplacent les questions existantes'
console.log(`\n✅  ${validated.length} questions ${action}`)
console.log(`   Fichier : ${relative(root, courseFile)}`)
console.log('\n   Questions générées :')
validated.forEach((q, i) => {
  const typeTag = { mcq: '🔘 MCQ', truefalse: '✅ V/F', fill: '✏️  Fill' }[q.type]
  console.log(`   ${i + 1}. [${typeTag}] ${q.prompt.slice(0, 80)}${q.prompt.length > 80 ? '…' : ''}`)
})
console.log('\n   → Vite rechargera automatiquement dans l\'app.')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findCourseFile(dir, id) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      const found = findCourseFile(full, id)
      if (found) return found
    } else if (entry === `${id.split('-').slice(-1)[0]}.json` || entry === `${id}.json`) {
      const content = JSON.parse(readFileSync(full, 'utf8'))
      if (content.id === id) return full
    }
  }
  return null
}

function listCourses(dir) {
  const ids = []
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.json')) {
        try { ids.push(JSON.parse(readFileSync(full, 'utf8')).id) } catch {}
      }
    }
  }
  walk(dir)
  return ids.sort()
}
