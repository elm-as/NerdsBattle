/**
 * Edge Function: generate-course
 * Génère un cours complet (leçon + questions) via DeepSeek.
 *
 * Améliorations v2 :
 * - Prompt enrichi, meilleure qualité pédagogique
 * - Retry automatique
 * - Validation robuste
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const MODEL = 'deepseek-chat' // DeepSeek-V3
const MAX_RETRIES = 2

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_TYPES = new Set(['mcq', 'truefalse', 'fill'])

const SUBJECT_LABELS: Record<string, string> = {
  maths: 'Mathématiques', physique: 'Physique-Chimie', svt: 'SVT',
  histoire: 'Histoire-Géo', anglais: 'Anglais', info: 'Informatique',
  francais: 'Français', philosophie: 'Philosophie', espagnol: 'Espagnol', allemand: 'Allemand'
}

const LEVEL_LABELS: Record<string, string> = {
  sixieme: '6ème', cinquieme: '5ème', quatrieme: '4ème', troisieme: '3ème',
  seconde: 'Seconde', premiere: 'Première', terminale: 'Terminale',
  prepa1: 'Prépa 1ère année', prepa2: 'Prépa 2ème année',
  licence1: 'Licence 1', licence2: 'Licence 2', licence3: 'Licence 3',
  master1: 'Master 1', master2: 'Master 2'
}

// ─── Validation du cours généré ──────────────────────────────────────────────────
function validateCourse(
  parsed: unknown, subject: string, level: string, slug: string
): { errors: string[]; course?: Record<string, unknown> } {
  const errors: string[] = []
  if (!parsed || typeof parsed !== 'object') return { errors: ['Pas un objet JSON'] }
  const p = parsed as Record<string, unknown>

  const str = (v: unknown, field: string, max = 4096): string => {
    if (typeof v !== 'string' || !v.trim()) { errors.push(`Champ manquant: ${field}`); return '' }
    return (v as string).trim().slice(0, max)
  }

  const title = str(p.title, 'title', 128)
  const summary = str(p.summary, 'summary', 512)
  const lesson = str(p.lesson, 'lesson', 16384)
  const minutes = Math.max(1, Math.min(60, Number(p.estimatedMinutes) || 8))
  const tags = Array.isArray(p.tags) ? p.tags.map(String).slice(0, 8) : []

  if (!Array.isArray(p.questions) || p.questions.length < 1) {
    errors.push('questions vide ou absent')
  }

  const questions = (Array.isArray(p.questions) ? p.questions : []).map((q: unknown, i: number) => {
    if (!q || typeof q !== 'object') { errors.push(`questions[${i}] invalide`); return null }
    const qo = q as Record<string, unknown>
    if (!ALLOWED_TYPES.has(qo.type as string)) { errors.push(`questions[${i}].type invalide`); return null }

    const base = {
      id: `q${i + 1}`,
      type: qo.type as string,
      prompt: str(qo.prompt as string, `questions[${i}].prompt`, 512),
      explanation: str(qo.explanation as string, `questions[${i}].explanation`, 512),
    }

    if (qo.type === 'mcq') {
      const opts = Array.isArray(qo.options) ? qo.options : []
      if (opts.length < 2) { errors.push(`questions[${i}].options invalide`); return null }
      const answer = Number(qo.answer)
      if (!Number.isInteger(answer) || answer < 0 || answer >= opts.length) {
        errors.push(`questions[${i}].answer hors bornes`); return null
      }
      return { ...base, options: opts.map(String), answer }
    }
    if (qo.type === 'truefalse') {
      if (typeof qo.answer !== 'boolean') { errors.push(`questions[${i}].answer doit être booléen`); return null }
      return { ...base, answer: qo.answer }
    }
    if (qo.type === 'fill') {
      const ans = typeof qo.answer === 'string' ? qo.answer.trim() : ''
      if (!ans) { errors.push(`questions[${i}].answer vide`); return null }
      return { ...base, answer: ans }
    }
    return null
  }).filter(Boolean)

  if (errors.length > 0) return { errors }

  return {
    errors: [],
    course: {
      id: `${subject}-${level}-${slug}`,
      subject_id: subject,
      level_id: level,
      slug,
      title,
      summary,
      lesson,
      estimated_minutes: minutes,
      tags,
      questions,
      source: 'ai',
    }
  }
}

// ─── Prompt builder ─────────────────────────────────────────────────────────────
function buildPrompt(subject: string, level: string, slug: string, title: string, questionCount: number) {
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject
  const levelLabel = LEVEL_LABELS[level] ?? level

  const system = `Tu es un professeur expert en ${subjectLabel}, niveau ${levelLabel} (système éducatif français).
Tu crées des cours de révision complets, structurés et pédagogiques.

RÈGLES IMPÉRATIVES :
- Contenu RIGOUREUX et EXACT — jamais d'approximation sur les faits
- Utilise LaTeX pour les formules : $...$ pour inline, $$...$$ pour blocs
- Structure claire : introduction, développement, conclusion, exemples
- Adapte la difficulté au niveau scolaire
- Pour les questions : varie les types (mcq, truefalse, fill)
- Chaque question a une explication pédagogique (1-2 phrases)

Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte hors JSON.`

  const user = `Génère un cours de révision complet.

Matière : ${subjectLabel}
Niveau : ${levelLabel}
Titre : "${title}"
Slug : "${slug}"

CONTENU ATTENDU :
- summary : 1-2 phrases accrocheuses qui donnent envie d'apprendre
- lesson : 3-5 paragraphes BIEN STRUCTURÉS avec exemples concrets, formules en $...$, définitions claires
- estimatedMinutes : entre 5 et 15 (temps de lecture estimé)
- tags : 2-4 mots-clés pertinents
- questions : EXACTEMENT ${questionCount} questions VARIÉES
  * Au moins 2 mcq (4 options, answer = index 0-based)
  * Au moins 1 truefalse (answer = true/false booléen)
  * Au moins 1 fill (answer = réponse courte 1-3 mots)
  * Chaque question a une "explanation" courte

⚠️ CRITIQUE : JSON parfaitement valide. Échappe les backslashes LaTeX (\\\\frac).

Format EXACT attendu :
{"id":"${subject}-${level}-${slug}","title":"...","summary":"...","lesson":"Texte avec $formules$...","estimatedMinutes":8,"tags":["tag1","tag2"],"questions":[{"id":"q1","type":"mcq","prompt":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}`

  return { system, user }
}

// ─── Appel DeepSeek avec retry ──────────────────────────────────────────────────
async function callDeepSeek(
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: attempt === 0 ? temperature : temperature + 0.1 * attempt,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
          messages,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 200)}`)
      }

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string') {
        throw new Error('Réponse vide')
      }

      return content
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Toutes les tentatives DeepSeek ont échoué')
}

// ─── Parsing robuste ────────────────────────────────────────────────────────────
function parseJSON(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw) } catch { /* continue */ }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }
  return null
}

// ─── Handler ────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: CORS })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: CORS })
    }

    const { subject, level, slug, title, questionCount = 6 } = await req.json()
    if (!subject || !level || !slug || !title) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants: subject, level, slug, title' }),
        { status: 400, headers: CORS }
      )
    }

    // Vérifier si le cours existe déjà
    const courseId = `${subject}-${level}-${slug}`
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: `Cours "${courseId}" existe déjà`, courseId }),
        { status: 409, headers: CORS }
      )
    }

    // Génération
    const { system, user: userPrompt } = buildPrompt(subject, level, slug, title, questionCount)
    const rawContent = await callDeepSeek([
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ])

    const parsed = parseJSON(rawContent)
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'JSON introuvable dans la réponse' }),
        { status: 502, headers: CORS }
      )
    }

    const { errors, course } = validateCourse(parsed, subject, level, slug)
    if (errors.length > 0 || !course) {
      return new Response(
        JSON.stringify({ error: 'Validation échouée', errors }),
        { status: 422, headers: CORS }
      )
    }

    // Insertion en base
    const { data: inserted, error: dbErr } = await supabase
      .from('courses')
      .insert({ ...course, created_by: user.id })
      .select()
      .single()

    if (dbErr) {
      return new Response(
        JSON.stringify({ error: 'Erreur DB', detail: dbErr.message }),
        { status: 500, headers: CORS }
      )
    }

    return new Response(
      JSON.stringify({ success: true, course: inserted }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erreur interne', detail: String(err) }),
      { status: 500, headers: CORS }
    )
  }
})
