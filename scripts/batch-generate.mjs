#!/usr/bin/env node
/**
 * NERDSBATCH - Génération batch de cours & quiz pour le programme ivoirien et francophone.
 *
 * Usage :
 *   node scripts/batch-generate.mjs [options]
 *
 * Options :
 *   --all                 Génère TOUS les cours ciblés (ou tous les manquants si combiné avec --missing-only)
 *   --missing-only        Ne génère que les cours non encore présents sur le disque
 *   --with-quiz           Génère 5-6 questions de quiz interactives par cours
 *   --concurrency <N>     Nombre de cours générés en parallèle (défaut : 3)
 *   --subject <matiere>   Filtre sur une matière spécifique
 *   --level <niveau>      Filtre sur un niveau spécifique
 *   --count <N>           Limite le nombre de cours à générer
 *   --force               Écrase les cours existants
 *   --dry-run             Affiche la liste sans appeler l'API
 *
 * Exemples :
 *   # TOUT générer en une seule commande avec parallélisation et quiz :
 *   node scripts/batch-generate.mjs --missing-only --all --with-quiz --concurrency 4
 *
 *   # Générer tous les cours manquants de Maths :
 *   node scripts/batch-generate.mjs --subject maths --missing-only --all --with-quiz
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Chargement du syllabus
const syllabusPath = new URL(`file:///${resolve(root, 'src', 'data', 'syllabus.js').replace(/\\/g, '/')}`).href
const { SYLLABUS } = await import(syllabusPath)

// Parse arguments
const args = process.argv.slice(2)
const options = {
  subject: getArg('--subject'),
  level: getArg('--level'),
  count: parseInt(getArg('--count')) || 0,
  concurrency: parseInt(getArg('--concurrency')) || 3,
  all: args.includes('--all'),
  withQuiz: args.includes('--with-quiz'),
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  missingOnly: args.includes('--missing-only') || args.includes('--all'),
}

function getArg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : null
}

// Récupère l'ensemble des cours existants sur disque
function getExistingCourses() {
  const existing = new Set()
  const coursesDir = join(root, 'src', 'data', 'courses')
  if (!existsSync(coursesDir)) return existing

  for (const subject of readdirSync(coursesDir)) {
    const subjectDir = join(coursesDir, subject)
    try {
      for (const level of readdirSync(subjectDir, { withFileTypes: true })) {
        if (!level.isDirectory()) continue
        const levelDir = join(subjectDir, level.name)
        for (const file of readdirSync(levelDir)) {
          if (file.endsWith('.json')) {
            const slug = file.replace('.json', '')
            existing.add(`${subject}-${level.name}-${slug}`)
          }
        }
      }
    } catch {}
  }
  return existing
}

// Collecte tous les cours définis dans le syllabus avec filtres
function collectTargetCourses(existing) {
  const targets = []
  
  for (const [subject, levels] of Object.entries(SYLLABUS)) {
    if (options.subject && options.subject !== subject) continue

    for (const [level, courses] of Object.entries(levels)) {
      if (options.level && options.level !== level) continue

      for (const course of courses) {
        const id = `${subject}-${level}-${course.slug}`
        const alreadyExists = existing.has(id)

        if (options.missingOnly && alreadyExists && !options.force) {
          continue
        }

        targets.push({
          subject,
          level,
          slug: course.slug,
          title: course.title,
          id
        })
      }
    }
  }

  if (options.count > 0 && targets.length > options.count) {
    return targets.slice(0, options.count)
  }

  return targets
}

// Appelle generate-course.mjs pour un cours donné
function generateSingleCourse(course, index, total) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const cmd = process.execPath // node binary
    const subArgs = [
      join(__dirname, 'generate-course.mjs'),
      course.subject,
      course.level,
      course.slug,
      course.title
    ]
    if (options.withQuiz) subArgs.push('--with-quiz')
    if (options.force) subArgs.push('--force')

    const child = spawn(cmd, subArgs, {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })

    child.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const progress = `[${index + 1}/${total}] (${Math.round(((index + 1) / total) * 100)}%)`

      if (code === 0) {
        console.log(`${progress} ✅ ${course.title} (${course.subject}/${course.level}) - ${elapsed}s`)
        resolve({ success: true, course })
      } else {
        console.error(`${progress} ❌ ERREUR sur "${course.title}" (${course.subject}/${course.level}) :`)
        if (stderr.trim()) console.error(`   ${stderr.trim().split('\n').pop()}`)
        else if (stdout.trim()) console.error(`   ${stdout.trim().split('\n').pop()}`)
        resolve({ success: false, course, error: stderr || stdout })
      }
    })
  })
}

// Gestionnaire de pool parallèle avec concurrence contrôlée
async function runPool(items, concurrency, workerFn) {
  const results = []
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor++
      const item = items[currentIndex]
      const res = await workerFn(item, currentIndex, items.length)
      results.push(res)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// Exécution principale
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║       NERDSBATTLE - GÉNÉRATEUR GLOBAL DE COURS & QUIZ          ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const existing = getExistingCourses()
  const targetCourses = collectTargetCourses(existing)

  console.log(`📚 Cours déjà présents sur le disque : ${existing.size}`)
  console.log(`🎯 Cours ciblés pour génération     : ${targetCourses.length}`)
  console.log(`⚡ Concurrence parallèle             : ${options.concurrency} workers`)
  console.log(`📝 Mode quiz                         : ${options.withQuiz ? 'Oui (5-6 questions / cours)' : 'Leçon uniquement'}`)

  if (targetCourses.length === 0) {
    console.log('\n🎉 Tous les cours demandés sont déjà générés et à jour !')
    process.exit(0)
  }

  if (options.dryRun) {
    console.log('\n[MODE DRY RUN - Liste des cours qui seraient générés] :\n')
    targetCourses.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.subject}/${c.level}] ${c.title} (${c.slug})`)
    })
    console.log(`\nTotal : ${targetCourses.length} cours`)
    process.exit(0)
  }

  console.log('\n🚀 Lancement de la génération en parallèle...\n')
  const startTime = Date.now()

  const results = await runPool(targetCourses, options.concurrency, generateSingleCourse)

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║                          BILAN FINAL                           ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log(`✅ Cours générés avec succès : ${succeeded} / ${targetCourses.length}`)
  if (failed > 0) console.log(`⚠️ Échecs                   : ${failed}`)
  console.log(`⏱️ Temps total écoulé        : ${totalTime} minutes`)

  // Export automatique du SQL Supabase
  console.log('\n📦 Exportation automatique du script SQL Supabase propre...')
  try {
    const exportScript = join(__dirname, 'export-supabase-courses.mjs')
    const child = spawn(process.execPath, [exportScript], { stdio: 'inherit', cwd: root })
    child.on('close', () => {
      console.log('✨ Tout est terminé et prêt !')
    })
  } catch (err) {
    console.error('Erreur export SQL :', err.message)
  }
}

main().catch((err) => {
  console.error('Erreur fatale :', err)
  process.exit(1)
})
