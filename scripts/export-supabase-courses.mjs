#!/usr/bin/env node
/**
 * Exporte tous les cours JSON de src/data/courses/ vers :
 *   1. Un fichier global : docs/supabase_courses_clean.sql
 *   2. Des fichiers découpés par matière : docs/sql/<matiere>.sql (parfait pour l'éditeur web Supabase !)
 *
 * Conforme au schéma Supabase :
 *   - tags : text[]
 *   - questions : jsonb
 *   - source : 'ai' ou 'manual'
 *
 * Usage:
 *   node scripts/export-supabase-courses.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coursesDir = join(root, 'src', 'data', 'courses')
const outSqlPath = join(root, 'docs', 'supabase_courses_clean.sql')
const outSqlDir = join(root, 'docs', 'sql')

mkdirSync(outSqlDir, { recursive: true })

function escapeSql(str) {
  if (str === null || str === undefined) return "''"
  return "'" + String(str).replace(/'/g, "''") + "'"
}

function formatTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]"
  const escapedElements = arr
    .map(el => String(el).trim().slice(0, 32))
    .filter(Boolean)
    .map(el => escapeSql(el))
  
  if (escapedElements.length === 0) return "'{}'::text[]"
  return `ARRAY[${escapedElements.join(', ')}]::text[]`
}

function generateInsertSql(r) {
  const jsonQuestions = escapeSql(JSON.stringify(r.questions))
  const tagsArraySql = formatTextArray(r.tags)

  return `INSERT INTO public.courses (id, subject_id, level_id, slug, title, summary, lesson, estimated_minutes, tags, questions, source)\n` +
    `VALUES (\n` +
    `  ${escapeSql(r.id)},\n` +
    `  ${escapeSql(r.subject_id)},\n` +
    `  ${escapeSql(r.level_id)},\n` +
    `  ${escapeSql(r.slug)},\n` +
    `  ${escapeSql(r.title)},\n` +
    `  ${escapeSql(r.summary)},\n` +
    `  ${escapeSql(r.lesson)},\n` +
    `  ${r.estimated_minutes},\n` +
    `  ${tagsArraySql},\n` +
    `  ${jsonQuestions}::jsonb,\n` +
    `  'ai'\n` +
    `)\n` +
    `ON CONFLICT (id) DO UPDATE SET\n` +
    `  title = EXCLUDED.title,\n` +
    `  summary = EXCLUDED.summary,\n` +
    `  lesson = EXCLUDED.lesson,\n` +
    `  estimated_minutes = EXCLUDED.estimated_minutes,\n` +
    `  tags = EXCLUDED.tags,\n` +
    `  questions = EXCLUDED.questions,\n` +
    `  source = EXCLUDED.source;\n\n`
}

const records = []
const recordsBySubject = {}

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

              const record = {
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
              }

              records.push(record)
              if (!recordsBySubject[subject]) recordsBySubject[subject] = []
              recordsBySubject[subject].push(record)
            } catch (err) {
              console.warn(`⚠️ Erreur lecture JSON ${fullPath}:`, err.message)
            }
          }
        } catch {}
      }
    } catch {}
  }
}

console.log(`📦 ${records.length} cours trouvés pour l'export SQL...`)

// 1. Fichier Global
let globalSql = `-- Script d'insertion propre des cours NerdsBattle pour Supabase\n\n`
for (const r of records) {
  globalSql += generateInsertSql(r)
}
writeFileSync(outSqlPath, globalSql, 'utf8')
console.log(`✅ Fichier global : ${outSqlPath}`)

// 2. Fichiers par matière (découpés pour l'éditeur web Supabase)
for (const [subj, subjRecords] of Object.entries(recordsBySubject)) {
  const subjSqlPath = join(outSqlDir, `${subj}.sql`)
  let subjSql = `-- Cours NerdsBattle : Matière ${subj} (${subjRecords.length} cours)\n\n`
  for (const r of subjRecords) {
    subjSql += generateInsertSql(r)
  }
  writeFileSync(subjSqlPath, subjSql, 'utf8')
}

console.log(`✅ Fichiers par matière découpés dans docs/sql/ :`)
for (const [subj, subjRecords] of Object.entries(recordsBySubject)) {
  console.log(`   - docs/sql/${subj}.sql (${subjRecords.length} cours)`)
}
