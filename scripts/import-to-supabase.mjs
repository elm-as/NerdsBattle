#!/usr/bin/env node
/**
 * Import direct des cours dans Supabase via l'API REST PostgREST.
 * 100% compatible Node 18+ (aucun problème de WebSocket Realtime).
 *
 * Usage :
 *   node scripts/import-to-supabase.mjs
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coursesDir = join(root, 'src', 'data', 'courses')

// Chargement du .env
try {
  const env = readFileSync(join(root, '.env'), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Variables Supabase manquantes dans .env (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const records = []

if (existsSync(coursesDir)) {
  for (const subject of readdirSync(coursesDir)) {
    const subjectPath = join(coursesDir, subject)
    try {
      for (const level of readdirSync(subjectPath)) {
        const levelPath = join(subjectPath, level)
        try {
          for (const file of readdirSync(levelPath)) {
            if (!file.endsWith('.json')) continue
            const fullPath = join(levelPath, file)
            try {
              const content = JSON.parse(readFileSync(fullPath, 'utf8'))
              const slug = file.replace('.json', '').trim().slice(0, 64)
              const id = (content.id || `${subject}-${level}-${slug}`).trim().slice(0, 128)
              const title = String(content.title || slug).trim().slice(0, 128)
              const summary = String(content.summary || '').trim().slice(0, 512)
              const lesson = String(content.lesson || '').trim().slice(0, 16384)
              const minutes = Math.max(1, Math.min(60, Number(content.estimatedMinutes) || 10))
              const tags = Array.isArray(content.tags) ? content.tags : []
              const questions = Array.isArray(content.questions) ? content.questions : []

              records.push({
                id,
                subject_id: subject.slice(0, 32),
                level_id: level.slice(0, 32),
                slug,
                title,
                summary,
                lesson,
                estimated_minutes: minutes,
                tags,
                questions,
                source: 'ai'
              })
            } catch (err) {
              console.warn(`⚠️ Erreur lecture JSON ${fullPath}:`, err.message)
            }
          }
        } catch {}
      }
    } catch {}
  }
}

console.log(`📦 ${records.length} cours trouvés sur le disque.`)
console.log(`🚀 Synchronisation avec Supabase (${SUPABASE_URL})...\n`)

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/courses`
const BATCH_SIZE = 30
let successCount = 0
let errorCount = 0

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const chunk = records.slice(i, i + BATCH_SIZE)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`❌ Erreur lot ${i + 1}-${i + chunk.length} (${res.status}) :`, errBody)
      errorCount += chunk.length
    } else {
      successCount += chunk.length
      const current = Math.min(i + BATCH_SIZE, records.length)
      const pct = Math.round((current / records.length) * 100)
      console.log(`✅ Lot ${i + 1} à ${current} synchronisé (${pct}%)`)
    }
  } catch (err) {
    console.error(`❌ Erreur réseau lot ${i + 1}-${i + chunk.length} :`, err.message)
    errorCount += chunk.length
  }
}

console.log(`\n╔════════════════════════════════════════════════════════════════╗`)
console.log(`║                        BILAN IMPORT                            ║`)
console.log(`╚════════════════════════════════════════════════════════════════╝`)
console.log(`✅ ${successCount} cours importés / mis à jour dans Supabase`)
if (errorCount > 0) {
  console.log(`⚠️ ${errorCount} cours en échec`)
}
console.log(`\n🎉 Import terminé !`)
