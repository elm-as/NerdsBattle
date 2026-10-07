#!/usr/bin/env node
/**
 * Analyse le statut du syllabus : quels cours existent, quels cours manquent
 *
 * Usage:
 *   node scripts/syllabus-status.mjs [options]
 *
 * Options:
 *   --subject <matiere>   Filtre par matière
 *   --level <niveau>      Filtre par niveau
 *   --missing             Affiche uniquement les cours manquants
 *   --json                Sortie JSON pour automation
 */

import { existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Chargement du syllabus (avec URL pour compatibilité Windows ESM)
const syllabusPath = new URL(`file:///${resolve(root, 'src', 'data', 'syllabus.js').replace(/\\/g, '/')}`).href
const { SYLLABUS } = await import(syllabusPath)

// Parse arguments
const args = process.argv.slice(2)
const options = {
  subject: getArg('--subject'),
  level: getArg('--level'),
  missing: args.includes('--missing'),
  json: args.includes('--json'),
}

function getArg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}

// Récupère les cours existants
function getExistingCourses() {
  const existing = new Set()
  const coursesDir = join(root, 'src', 'data', 'courses')
  
  for (const subject of Object.keys(SYLLABUS)) {
    const subjectDir = join(coursesDir, subject)
    if (!existsSync(subjectDir)) continue
    
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
  }
  
  return existing
}

// Main
async function main() {
  const existing = getExistingCourses()
  
  // Calcul des stats
  const stats = {}
  let totalExpected = 0
  let totalExisting = 0
  
  for (const [subject, levels] of Object.entries(SYLLABUS)) {
    if (options.subject && options.subject !== subject) continue
    
    stats[subject] = { total: 0, existing: 0, missing: 0, levels: {} }
    
    for (const [level, courses] of Object.entries(levels)) {
      if (options.level && options.level !== level) continue
      
      const levelStats = { total: courses.length, existing: 0, missing: [], courses: [] }
      
      for (const course of courses) {
        totalExpected++
        const courseId = `${subject}-${level}-${course.slug}`
        const isExisting = existing.has(courseId)
        
        if (isExisting) {
          levelStats.existing++
          totalExisting++
        } else {
          levelStats.missing.push(course)
        }
        
        levelStats.courses.push({
          ...course,
          id: courseId,
          exists: isExisting
        })
      }
      
      stats[subject].levels[level] = levelStats
      stats[subject].total += levelStats.total
      stats[subject].existing += levelStats.existing
      stats[subject].missing += levelStats.missing.length
    }
  }
  
  // Output JSON
  if (options.json) {
    console.log(JSON.stringify({
      summary: {
        total: totalExpected,
        existing: totalExisting,
        missing: totalExpected - totalExisting,
        completionRate: Math.round((totalExisting / totalExpected) * 100)
      },
      stats
    }, null, 2))
    return
  }
  
  // Output console
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          SYLLABUS STATUS - NerdsBattle                       ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  console.log(`📊 Global : ${totalExisting}/${totalExpected} cours générés (${Math.round((totalExisting/totalExpected)*100)}%)\n`)
  
  for (const [subject, subjectStats] of Object.entries(stats)) {
    const completion = Math.round((subjectStats.existing / subjectStats.total) * 100)
    const bar = '█'.repeat(Math.floor(completion / 10)) + '░'.repeat(10 - Math.floor(completion / 10))
    
    console.log(`\n${subject.toUpperCase()} [${bar}] ${completion}% (${subjectStats.existing}/${subjectStats.total})`)
    console.log('─'.repeat(60))
    
    for (const [level, levelStats] of Object.entries(subjectStats.levels)) {
      const levelCompletion = Math.round((levelStats.existing / levelStats.total) * 100)
      const icon = levelCompletion === 100 ? '✅' : levelCompletion === 0 ? '❌' : '🔄'
      
      if (options.missing) {
        // Affiche uniquement les manquants
        for (const course of levelStats.missing) {
          console.log(`   ❌ ${course.title}`)
          console.log(`      ${subject}/${level}/${course.slug}`)
          console.log(`      Tags: ${course.tags.join(', ')}`)
          console.log()
        }
      } else {
        // Affiche le résumé par niveau
        console.log(`   ${icon} ${level.padEnd(12)} ${levelStats.existing}/${levelStats.total}`)
        
        if (levelStats.missing.length > 0 && !options.missing) {
          console.log(`      Manque: ${levelStats.missing.map(c => c.title).slice(0, 3).join(', ')}${levelStats.missing.length > 3 ? '...' : ''}`)
        }
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60))
  console.log('💡 Conseils :')
  console.log('   • Générer les cours manquants :')
  console.log('     node scripts/batch-generate.mjs --missing-only --count 5')
  console.log()
  console.log('   • Générer pour une matière spécifique :')
  console.log('     node scripts/batch-generate.mjs --subject maths --level terminale')
  console.log()
  console.log('   • Voir uniquement les manquants :')
  console.log('     node scripts/syllabus-status.mjs --missing')
  console.log('═'.repeat(60))
}

main().catch(err => {
  console.error('Erreur :', err)
  process.exit(1)
})
