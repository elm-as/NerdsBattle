#!/usr/bin/env node
/**
 * Génère un cours JSON complet conforme au Programme Éducatif Ivoirien (MENA) & francophone via LLM.
 *
 * Usage :
 *   node scripts/generate-course.mjs <subject> <level> <slug> "Titre du cours" [--force] [--with-quiz]
 *
 * Exemples :
 *   node scripts/generate-course.mjs maths terminale fonction-logarithme-neperien "Fonction Logarithme Népérien"
 *   node scripts/generate-course.mjs physique premiere travail-energie-cinetique "Travail et énergie cinétique" --with-quiz
 *
 * Variables d'environnement (.env) :
 *   API_KEY         (obligatoire) Clé API (DeepSeek, OpenAI, Groq, Mistral...)
 *   API_BASE_URL    (optionnel)   Défaut : https://api.deepseek.com/v1
 *   API_MODEL       (optionnel)   Défaut : deepseek-chat
 *   QUESTION_COUNT  (optionnel)   Nombre de questions (défaut : 5 si --with-quiz activé)
 *   DRY_RUN         (optionnel)   Si "1", affiche le prompt sans appeler l'API
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Chargement automatique du .env ──────────────────────────────────────────
const _root = join(dirname(fileURLToPath(import.meta.url)), '..')
try {
  const _env = readFileSync(join(_root, '.env'), 'utf8')
  for (const line of _env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* .env optionnel */ }

// ─── Configuration ───────────────────────────────────────────────────────────
const API_KEY        = process.env.API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
const API_BASE_URL   = process.env.API_BASE_URL || 'https://api.deepseek.com/v1'
const API_MODEL      = process.env.API_MODEL    || 'deepseek-chat'
const DRY_RUN        = process.env.DRY_RUN === '1'

// ─── Args ─────────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2)
const flags = rawArgs.filter(a => a.startsWith('--'))
const positional = rawArgs.filter(a => !a.startsWith('--'))

const force = flags.includes('--force')
const withQuiz = flags.includes('--with-quiz') || parseInt(process.env.QUESTION_COUNT || '0', 10) > 0
const questionCount = parseInt(process.env.QUESTION_COUNT || '5', 10)

const [subject, level, slug, ...titleParts] = positional
const title = titleParts.join(' ')

const SUBJECTS = [
  'maths', 'physique', 'svt', 'histoire', 'anglais', 'info',
  'francais', 'philosophie', 'espagnol', 'allemand'
]
const LEVELS = [
  'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
  'seconde', 'premiere', 'terminale',
  'prepa1', 'prepa2',
  'licence1', 'licence2', 'licence3', 'master1', 'master2'
]
const LEVEL_LABELS = {
  sixieme: '6ème (Collège)', cinquieme: '5ème (Collège)', quatrieme: '4ème (Collège)', troisieme: '3ème (BEPC)',
  seconde: 'Seconde (Lycée)', premiere: 'Première (Lycée)', terminale: 'Terminale (BAC)',
  prepa1: 'Prépa 1ère année', prepa2: 'Prépa 2ème année',
  licence1: 'Licence 1', licence2: 'Licence 2', licence3: 'Licence 3',
  master1: 'Master 1', master2: 'Master 2'
}
const SUBJECT_LABELS = {
  maths: 'Mathématiques', physique: 'Physique-Chimie', svt: 'Sciences de la Vie et de la Terre (SVT)',
  histoire: 'Histoire-Géographie', anglais: 'Anglais', info: 'Informatique / TICE',
  francais: 'Français (Langue & Littérature)', philosophie: 'Philosophie', espagnol: 'Espagnol', allemand: 'Allemand'
}

if (!subject || !level || !slug || !title) {
  console.error('Usage: node scripts/generate-course.mjs <subject> <level> <slug> "Titre" [--force] [--with-quiz]')
  process.exit(1)
}
if (!SUBJECTS.includes(subject)) {
  console.error(`Matière inconnue : ${subject}`)
  process.exit(1)
}
if (!LEVELS.includes(level)) {
  console.error(`Niveau inconnu : ${level}`)
  process.exit(1)
}
if (!API_KEY && !DRY_RUN) {
  console.error('❌  Clé API manquante. Renseigne API_KEY ou DEEPSEEK_API_KEY dans ton fichier .env')
  process.exit(1)
}

// ─── Chemin de sortie ─────────────────────────────────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src', 'data', 'courses', subject, level)
const outFile = join(dir, `${slug}.json`)

if (existsSync(outFile) && !force) {
  console.log(`ℹ️  Le cours existe déjà : ${outFile} (utilise --force pour régénérer)`)
  process.exit(0)
}

// ─── Prompts ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un inspecteur pédagogique et professeur d'élite spécialiste des programmes scolaires francophones et du Programme Éducatif Ivoirien (MENA / Approche Par les Compétences APC : 6ème à Terminale).
Tu rédiges des cours de révision clairs, structurés, vivants et rigoureux, avec des formules en notation LaTeX KaTeX ($...$ en ligne, $$...$$ en bloc centré).
Tu réponds UNIQUEMENT par un objet JSON valide, sans balises markdown de code (\`\`\`json), sans texte avant ni après.`

const quizInstruction = withQuiz ? `
- questions : Un tableau de ${questionCount} questions de quiz interactives et variées pour tester la compréhension :
  * Types autorisés : "mcq" (QCM avec options), "truefalse" (Vrai/Faux), "fill" (Texte à trou ou calcul direct).
  * Structure d'une question mcq : { "id": "q1", "type": "mcq", "prompt": "...", "options": ["A", "B", "C", "D"], "answer": 1, "explanation": "..." } (answer = index 0-based).
  * Structure truefalse : { "id": "q2", "type": "truefalse", "prompt": "...", "answer": true, "explanation": "..." }.
  * Structure fill : { "id": "q3", "type": "fill", "prompt": "...", "answer": "valeur", "explanation": "..." }.
` : `- IMPORTANT : Ne PAS inclure de questions, uniquement le cours.`

const USER_PROMPT = `Génère un cours complet, captivant et pédagogique pour la matière "${SUBJECT_LABELS[subject]}" au niveau "${LEVEL_LABELS[level]}".

Titre du cours : "${title}"
Identifiant : "${subject}-${level}-${slug}"

Directives de contenu :
1. summary : 2 phrases percutantes qui résument l'essentiel et l'utilité du chapitre pour l'élève.
2. lesson : Leçon complète au format Markdown comprenant :
   - ## Introduction & Mise en situation : Pourquoi ce chapitre est crucial et à quoi il sert.
   - ## 1. Définitions et Principes Fondamentaux : Notions clés avec formules mathématiques/scientifiques en notation LaTeX KaTeX ($...$ ou $$...$$).
   - ## 2. Propriétés et Méthodes d'application : Les théorèmes ou méthodes pas-à-pas avec des exemples concrets et calculés.
   - ## 3. Pièges fréquents & Mises en garde : Les erreurs classiques commises aux examens (BEPC ou BAC) et comment les éviter.
   - ## Synthèse : Un récapitulatif synthétique des 3 points à retenir absolument.
3. estimatedMinutes : Durée estimée de lecture (entre 8 et 15 minutes).
4. tags : 3 à 5 tags pertinents (ex: ["analyse", "fonctions", "bac"]).
${quizInstruction}

Format JSON STRICT attendu :
{
  "id": "${subject}-${level}-${slug}",
  "title": "${title}",
  "summary": "...",
  "lesson": "...",
  "estimatedMinutes": 12,
  "tags": ["..."]${withQuiz ? ',\n  "questions": [...]' : ''}
}`

if (DRY_RUN) {
  console.log('=== SYSTEM PROMPT ===\n', SYSTEM_PROMPT)
  console.log('\n=== USER PROMPT ===\n', USER_PROMPT)
  process.exit(0)
}

console.log(`\n🤖  Génération : "${title}" (${subject} / ${level})…`)
console.log(`   Fournisseur : ${API_BASE_URL} | Modèle : ${API_MODEL}`)

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
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT }
      ]
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`❌  Erreur API (${res.status}) :`, errText)
    process.exit(1)
  }

  const json = await res.json()
  raw = json.choices?.[0]?.message?.content
  if (!raw) throw new Error('Réponse vide du modèle')
} catch (e) {
  console.error('❌  Erreur lors de l\'appel API :', e.message)
  process.exit(1)
}

// Nettoyage et parsing JSON
let parsed
try {
  parsed = JSON.parse(raw)
} catch {
  const m = raw.match(/\{[\s\S]+\}/)
  if (!m) {
    console.error('❌  JSON introuvable dans la réponse brute :')
    console.error(raw.slice(0, 500))
    process.exit(1)
  }
  try {
    parsed = JSON.parse(m[0])
  } catch (err) {
    console.error('❌  Impossible de parser le JSON :', err.message)
    process.exit(1)
  }
}

// Validation
const errors = []
if (!parsed.title) errors.push('Champ "title" manquant')
if (!parsed.summary) errors.push('Champ "summary" manquant')
if (!parsed.lesson) errors.push('Champ "lesson" manquant')

if (errors.length > 0) {
  console.error('❌  Validation échouée :', errors.join(', '))
  process.exit(1)
}

const finalCourse = {
  id: `${subject}-${level}-${slug}`,
  title: String(parsed.title).trim(),
  summary: String(parsed.summary).trim(),
  lesson: String(parsed.lesson).trim(),
  estimatedMinutes: Number(parsed.estimatedMinutes) || 12,
  tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).trim()).filter(Boolean) : [],
}

if (withQuiz && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
  finalCourse.questions = parsed.questions
}

mkdirSync(dir, { recursive: true })
writeFileSync(outFile, JSON.stringify(finalCourse, null, 2) + '\n', 'utf8')

console.log(`✅  Cours enregistré avec succès : ${outFile}`)
console.log(`    Titre   : ${finalCourse.title}`)
console.log(`    Durée   : ${finalCourse.estimatedMinutes} min`)
if (finalCourse.questions) {
  console.log(`    Quiz    : ${finalCourse.questions.length} questions générées`)
}
