#!/usr/bin/env node
// Génère un squelette de cours JSON dans la bonne arborescence.
// Usage : node scripts/new-course.mjs <subjectId> <levelId> <slug> "Titre"
// Ex   : node scripts/new-course.mjs maths sixieme fractions "Les fractions"

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const [, , subject, level, slug, ...titleParts] = process.argv
const title = titleParts.join(' ')

if (!subject || !level || !slug || !title) {
  console.error('Usage: node scripts/new-course.mjs <subject> <level> <slug> "Titre"')
  process.exit(1)
}
if (!SUBJECTS.includes(subject)) {
  console.error(`Subject inconnu : ${subject}. Attendu : ${SUBJECTS.join(', ')}`)
  process.exit(1)
}
if (!LEVELS.includes(level)) {
  console.error(`Level inconnu : ${level}. Attendu : ${LEVELS.join(', ')}`)
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src', 'data', 'courses', subject, level)
const file = join(dir, `${slug}.json`)
if (existsSync(file)) {
  console.error(`Existe déjà : ${file}`)
  process.exit(1)
}

mkdirSync(dir, { recursive: true })

const tpl = {
  id: `${subject}-${level}-${slug}`,
  title,
  summary: 'Résumé court à compléter.',
  lesson: 'Texte de cours à compléter.',
  estimatedMinutes: 8,
  tags: [],
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      prompt: 'Question exemple ?',
      options: ['A', 'B', 'C', 'D'],
      answer: 0,
      explanation: 'Pourquoi A.'
    }
  ]
}

writeFileSync(file, JSON.stringify(tpl, null, 2) + '\n', 'utf8')
console.log(`Créé : ${file}`)
