/**
 * Edge Function: generate-questions
 * Génère des questions de quiz de CULTURE GÉNÉRALE via DeepSeek.
 *
 * V3 — Refonte totale :
 * - Culture générale INTERNATIONALE (pas franco-français)
 * - Triple vérification des réponses (génère → vérifie → valide)
 * - Rejet automatique des questions douteuses
 * - Format interne unifié (answer = string, JAMAIS d'index ambigu)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// ─── Config ────────────────────────────────────────────────────────────────────
const MODEL = 'deepseek-chat'
const MAX_RETRIES = 2
const RATE_LIMIT = 12
const RATE_WINDOW_MS = 60 * 60 * 1000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Thèmes de culture générale internationaux ─────────────────────────────────
const THEMES = [
  'Mathématiques',
  'Histoire mondiale',
  'Sciences et découvertes',
  'Géographie et capitales',
  'Arts et littérature',
  'Sport et compétitions',
  'Technologie et innovation',
  'Musique et cinéma',
  'Nature et environnement',
  'Espace et astronomie',
  'Mythologies du monde',
]

// ─── Validation des questions ──────────────────────────────────────────────────
function validateAndNormalize(raw: unknown[]): {
  questions: Record<string, unknown>[];
  errors: string[];
  rejected: number;
} {
  const questions: Record<string, unknown>[] = []
  const errors: string[] = []
  let rejected = 0
  const ALLOWED = new Set(['mcq', 'truefalse', 'fill'])

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as Record<string, unknown> | null
    if (!q || typeof q !== 'object') { errors.push(`[${i}] pas un objet`); rejected++; continue }
    if (!ALLOWED.has(q.type as string)) { errors.push(`[${i}] type invalide: ${q.type}`); rejected++; continue }
    const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : ''
    if (!prompt || prompt.length < 10) { errors.push(`[${i}] prompt trop court`); rejected++; continue }

    const base = {
      id: `q${questions.length + 1}`,
      type: q.type,
      prompt,
      explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
    }

    if (q.type === 'mcq') {
      const rawOpts = Array.isArray(q.options) ? q.options.filter(Boolean) : []
      if (rawOpts.length < 2) { errors.push(`[${i}] options < 2`); rejected++; continue }

      // Normaliser les options en strings propres
      const options = rawOpts.map((o: unknown) => String(o).trim()).filter(o => o.length > 0)
      if (options.length < 2) { errors.push(`[${i}] options invalides après trim`); rejected++; continue }

      // Déterminer la réponse : on accepte index numérique OU label string
      let answerIndex = -1
      const rawAnswer = q.answer

      if (typeof rawAnswer === 'number' && Number.isInteger(rawAnswer) && rawAnswer >= 0 && rawAnswer < options.length) {
        answerIndex = rawAnswer
      } else if (typeof rawAnswer === 'string') {
        const clean = rawAnswer.trim()
        // Essayer de parser comme nombre
        const num = Number(clean)
        if (Number.isInteger(num) && num >= 0 && num < options.length) {
          answerIndex = num
        } else {
          // Chercher par label (insensible à la casse et accents)
          const normalized = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          answerIndex = options.findIndex(opt => {
            const n = opt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return n === normalized || n.includes(normalized) || normalized.includes(n)
          })
        }
      }

      if (answerIndex < 0 || answerIndex >= options.length) {
        errors.push(`[${i}] answer invalide (${JSON.stringify(rawAnswer)}) pour options [${options.join(', ')}]`)
        rejected++
        continue
      }

      // Stocker à la fois l'index (pour compatibilité) et le label (pour vérification)
      questions.push({
        ...base,
        type: 'mcq',
        options,
        answer: answerIndex,                 // index numérique pour le client
        _correctLabel: options[answerIndex], // label vérifié pour debug
        _optionsCount: options.length,
      })
    } else if (q.type === 'truefalse') {
      const ans = q.answer
      const isTrue = ans === true || ans === 'true' || ans === 'vrai'
      const isFalse = ans === false || ans === 'false' || ans === 'faux'
      if (!isTrue && !isFalse) { errors.push(`[${i}] answer truefalse ambigu: ${ans}`); rejected++; continue }
      questions.push({ ...base, answer: isTrue })
    } else if (q.type === 'fill') {
      const ans = typeof q.answer === 'string' ? q.answer.trim() : String(q.answer || '').trim()
      if (!ans || ans.length < 1 || ans.length > 80) { errors.push(`[${i}] answer fill invalide`); rejected++; continue }
      questions.push({ ...base, answer: ans })
    }
  }

  return { questions, errors, rejected }
}

// ─── Prompt builder — CULTURE GÉNÉRALE INTERNATIONALE ──────────────────────────

/**
 * Sous-prompt de difficulté générique, adapté au niveau scolaire du joueur.
 * S'applique à TOUS les thèmes (pas seulement les maths).
 */
function buildLevelPrompt(levelId: string, topic?: string): string {
  const levelLabel = LEVEL_LABELS[levelId] ?? 'Terminale'

  // Échelle de difficulté par cycle (ordre croissant de complexité)
  const cycleOrder = [
    'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
    'seconde', 'premiere', 'terminale',
    'prepa1', 'prepa2',
    'licence1', 'licence2', 'licence3',
    'master1', 'master2'
  ]
  const idx = cycleOrder.indexOf(levelId)
  const tier = idx < 0 ? 'intermédiaire'
    : idx <= 3 ? 'débutant'
    : idx <= 6 ? 'intermédiaire'
    : idx <= 8 ? 'avancé'
    : 'expert'

  const tierDesc: Record<string, string> = {
    débutant: 'Questions factuelles simples : dates, noms, définitions de base. Évite les concepts abstraits. Privilégie le "qui / quoi / où / quand".',
    intermédiaire: 'Questions de compréhension et mise en relation. Causes/conséquences, comparaisons, analyse simple. Mélange de factuel et de réflexion.',
    avancé: 'Questions conceptuelles : synthèse, interprétation, nuances. Les distracteurs sont subtils. Connaissances moins évidentes attendues.',
    expert: 'Questions de haut niveau : théories, débats, cas limites, exceptions. Analyse critique attendue. Distracteurs très proches de la vérité.'
  }

  const desc = tierDesc[tier] || tierDesc['intermédiaire']

  // Si c'est des maths, on ajoute le programme spécifique
  const mathExtra = topic === 'maths' ? buildMathProgram(levelId) : ''

  return `
🎓 DIFFICULTÉ ADAPTÉE AU NIVEAU ${levelLabel} (${tier}) :

${desc}
${mathExtra ? '\n' + mathExtra : ''}

CONSIGNES :
- Niveau ${levelLabel} : adapte la difficulté en conséquence. ${idx <= 3 ? 'Reste simple et concret.' : idx >= 9 ? 'N\'hésite pas à être pointu et exigeant.' : 'Équilibre accessibilité et challenge.'}
- Les concepts évoqués doivent être à la portée d'un élève de ${levelLabel}
- Pour un niveau débutant : privilégie la reconnaissance, pas le raisonnement complexe
- Pour un niveau expert : va dans les détails, les exceptions, les cas particuliers
`
}

/**
 * Programme de maths par niveau (utilisé uniquement si topic === 'maths').
 * Donne les notions précises à respecter pour chaque niveau.
 */
function buildMathProgram(levelId: string): string {
  const programs: Record<string, string> = {
    sixieme: 'Nombres entiers et décimaux, fractions simples, géométrie de base (périmètres, aires, symétrie), opérations élémentaires.',
    cinquieme: 'Nombres relatifs, fractions (+/−), proportionnalité, triangles, angles et droites parallèles.',
    quatrieme: 'Puissances, équations 1er degré, théorème de Pythagore, cosinus, translations/rotations.',
    troisieme: 'Racines carrées, identités remarquables, fonctions affines, Thalès, trigonométrie, statistiques, systèmes.',
    seconde: 'Ensembles de nombres, intervalles, fonctions (affines, référence), vecteurs, produit scalaire, suites simples.',
    premiere: 'Dérivées, exponentielle, logarithme, trigonométrie, suites (limites), probabilités conditionnelles, dénombrement.',
    terminale: 'Limites, continuité, convexité, intégration, nombres complexes, équations différentielles, lois de probabilité, géométrie espace.',
    prepa1: 'Espaces vectoriels, structures algébriques, réduction, suites/séries, intégrales généralisées, EDL.',
    prepa2: 'Topologie, calcul différentiel, intégrales multiples, séries entières, probabilités avancées.',
    licence1: 'Logique, ensembles, polynômes, ev de dimension finie, matrices, intégration de Riemann.',
    licence2: 'Réduction, formes quadratiques, séries de fonctions, séries de Fourier, probabilités continues.',
    licence3: 'Topologie métrique, théorie de la mesure, analyse fonctionnelle, calcul diff dans Rn.',
    master1: 'Intégration de Lebesgue, analyse complexe, EDP, géométrie différentielle.',
    master2: 'Théorie spectrale, processus stochastiques, analyse harmonique, optimisation.',
  }

  const desc = programs[levelId] ?? programs['terminale']

  return `PROGRAMME DE MATHS À RESPECTER (${LEVEL_LABELS[levelId] ?? levelId}) :
Notions autorisées : ${desc}
- PAS DE HORS-PROGRAMME. Les questions DOIVENT porter UNIQUEMENT sur ces notions.
- Utilise SYSTÉMATIQUEMENT LaTeX : $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\pi$, $\\int$, $\\sum$, $\\lim$
- Pour les MCQ : options en LaTeX si elles contiennent des formules
- Pour les fill : réponse = chiffre ou expression mathématique simple`
}
function buildPrompt(params: {
  subjectId: string; levelId: string; questionCount: number;
  existingCourseLesson?: string; topic?: string
}) {
  const { subjectId, questionCount, existingCourseLesson, topic, levelId } = params
  const count = Math.min(Math.max(questionCount, 5), 12)
  const theme = topic || THEMES[Math.floor(Math.random() * THEMES.length)]

  // Si on a un cours existant, on génère dessus
  const lessonContext = existingCourseLesson
    ? `\nIMPORTANT : Base TES questions EXCLUSIVEMENT sur ce contenu :
---
${existingCourseLesson.slice(0, 2500)}
---`
    : ''

  const system = `Tu es un MAÎTRE DE QUIZ de culture générale, reconnu internationalement.
Tu crées des questions de quiz VARIÉES, AMUSANTES et INSTRUCTIVES.
${buildLevelPrompt(levelId, topic)}
RÈGLES ABSOLUES — à respecter IMPÉRATIVEMENT :

1. EXACTITUDE TOTALE : chaque réponse DOIT être vérifiable et 100% correcte.
   - Si tu as le moindre doute sur une réponse → ne pose pas cette question
   - Les faits historiques, scientifiques, géographiques DOIVENT être exacts
   - Une SEULE réponse correcte par question

2. DIVERSITÉ CULTURELLE : couvre TOUS les continents et cultures.
   - Pas centré sur un seul pays
   - Exemples : capitales africaines, inventions asiatiques, mythes amérindiens, art océanien, etc.

3. VARIÉTÉ DES TYPES :
   - mcq : 4 options, UNE SEULE bonne (les 3 autres = distracteurs PLAUSIBLES)
   - truefalse : affirmation vérifiable vrai/faux
   - fill : réponse courte (nom propre, chiffre, mot-clé)

4. FORMAT LaTeX : $x^2$ pour inline, $$\\frac{a}{b}$$ pour bloc.
   - ⚠️ DOUBLE les backslashes dans le JSON : \\\\frac et \\\\sqrt

5. TON : pas scolaire, pas doctoral. Amusant et engageant, comme un jeu télé.

6. RÉPONSE MCQ : le champ "answer" DOIT être le NUMÉRO de l'option correcte (0, 1, 2 ou 3).
   - JAMAIS le texte de la réponse pour les mcq
   - VÉRIFIE que le numéro correspond bien à la bonne option

Réponds UNIQUEMENT avec du JSON valide, sans markdown.`

  const user = `Génère EXACTEMENT ${count} questions de quiz de CULTURE GÉNÉRALE.

${lessonContext || `Thème suggéré : ${theme} (mais tu peux varier)`}

NIVEAU DU JOUEUR : ${LEVEL_LABELS[levelId] ?? 'Terminale'} — adapte la difficulté en conséquence (voir règles dans le prompt système).

STRUCTURE EXIGÉE :
- Minimum 2 mcq (4 options), minimum 1 truefalse, minimum 1 fill
- Les questions doivent couvrir des SUJETS VARIÉS (histoire, sciences, géo, arts, sport, nature...)
- Pour les MCQ : 4 options, "answer" = numéro de la bonne (0-3). VÉRIFIE QUE C'EST LE BON NUMÉRO.
- Pour les truefalse : "answer" = true ou false (booléen)
- Pour les fill : "answer" = réponse courte en minuscules sans article
- Chaque question a une "explanation" (1-2 phrases, fun fact bienvenu)

${lessonContext ? '⚠️ Les questions doivent porter EXCLUSIVEMENT sur le contenu fourni ci-dessus.' : '⚠️ Varie les sujets : pas 2 questions sur le même thème si possible.'}

EXEMPLE DE FORMAT CORRECT :
{
  "questions": [
    {"id":"q1","type":"mcq","prompt":"Quel pays possède le plus de langues officielles ?","options":["Inde","Zimbabwe","Afrique du Sud","Suisse"],"answer":2,"explanation":"L'Afrique du Sud a 12 langues officielles, un record mondial."},
    {"id":"q2","type":"truefalse","prompt":"Le Sahara est le plus grand désert du monde.","answer":false,"explanation":"C'est l'Antarctique, avec 14 millions de km²."},
    {"id":"q3","type":"fill","prompt":"Quel élément chimique a pour symbole 'Au' ?","answer":"or","explanation":"'Au' vient du latin 'aurum', qui signifie or."}
  ]
}

⚠️ CRITIQUE : VÉRIFIE CHAQUE RÉPONSE avant de l'écrire. Si tu n'es pas 100% sûr, change de question.
⚠️ Le JSON doit être PARFAITEMENT valide. Échappe les \\ en LaTeX.`

  return { system, user, theme }
}

// ─── Prompt de VÉRIFICATION ────────────────────────────────────────────────────
function buildVerifyPrompt(questions: Record<string, unknown>[], theme: string) {
  const system = `Tu es un VÉRIFICATEUR DE FAITS impitoyable. Ta mission : vérifier que chaque question de quiz est 100% CORRECTE.

RÈGLES :
1. Pour CHAQUE question, vérifie que la réponse est EXACTE
2. Si une réponse est FAUSSE → CORRIGE-LA (change answer, pas la question)
3. Si une question est AMBIGUË et que tu ne peux pas trancher → SUPPRIME-LA du tableau
4. Ne change JAMAIS l'énoncé d'une question, seulement les réponses
5. Garde l'index 0-based pour les MCQ (answer = numéro de l'option correcte)
6. Conserve le même nombre de questions ou moins (jamais plus)
7. Vérifie AUSSI les truefalse : si l'affirmation est vraie, answer=true, sinon false

RÉPONDS UNIQUEMENT avec : {"questions": [...]}`

  const user = `Vérifie ces ${questions.length} questions de quiz sur le thème : ${theme}

${JSON.stringify(questions, null, 2)}

Pour chaque question :
- La réponse est-elle correcte ?
- Les distracteurs sont-ils clairement faux mais plausibles ?
- Y a-t-il une ambiguïté ?

Retourne le tableau CORRIGÉ (ou filtré). Format : {"questions": [...]}`

  return { system, user }
}

// ─── Prompt de VALIDATION FINALE ───────────────────────────────────────────────
function buildFinalCheckPrompt(questions: Record<string, unknown>[]) {
  const system = `Tu es un ULTIME VALIDATEUR. Tu reçois des questions de quiz déjà vérifiées.
Ton job : confirmer que TOUT est parfait, ou signaler les problèmes restants.

Pour CHAQUE question, réponds par un objet :
{
  "questionId": "q1",
  "verdict": "ok" | "fix" | "reject",
  "confidence": 0-100,
  "fixedAnswer": null (si verdict=fix, mets la bonne réponse),
  "reason": "explication courte"
}

Réponds UNIQUEMENT avec : {"checks": [...]}`

  const user = `Questions à valider :
${JSON.stringify(questions, null, 2)}

Pour chaque question, donne ton verdict. Si tu rejettes ou corriges, explique pourquoi.`

  return { system, user }
}

// ─── Appel DeepSeek avec retry ─────────────────────────────────────────────────
async function callDeepSeek(
  messages: { role: string; content: string }[],
  temperature = 0.8,
  maxTokens = 4096
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
          temperature: attempt === 0 ? temperature : Math.min(temperature + 0.15 * attempt, 1.0),
          max_tokens: maxTokens,
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
        throw new Error('Réponse vide du modèle')
      }
      return content
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
      }
    }
  }
  throw lastError || new Error('Toutes les tentatives DeepSeek ont échoué')
}

// ─── Parsing JSON robuste ──────────────────────────────────────────────────────
function parseJSON(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw) } catch { /* continue */ }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }
  return null
}

// ─── CŒUR : génération avec triple vérification ────────────────────────────────
async function generateQuestionsWithAI(params: {
  subjectId: string; levelId: string; questionCount: number;
  existingCourseLesson?: string; topic?: string
}): Promise<{ questions: Record<string, unknown>[]; errors: string[]; theme: string }> {

  const { system, user, theme } = buildPrompt(params)

  // ── ÉTAPE 1 : Génération ─────────────────────────────────────────────────
  const rawContent = await callDeepSeek(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    0.9,
    4096
  )

  const parsed = parseJSON(rawContent)
  if (!parsed) throw new Error('JSON introuvable dans la réponse du modèle (étape 1)')

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions
    : Array.isArray(parsed) ? parsed
    : []
  if (rawQuestions.length < 2) throw new Error(`Pas assez de questions générées (${rawQuestions.length})`)

  let { questions, errors, rejected } = validateAndNormalize(rawQuestions)
  console.log(`[Étape 1] ${questions.length} questions valides, ${rejected} rejetées, ${errors.length} erreurs`)

  if (questions.length < 2) {
    throw new Error(`Pas assez de questions valides après étape 1 (${questions.length}) — erreurs: ${errors.join('; ')}`)
  }

  // ── ÉTAPE 2 : Vérification des faits ─────────────────────────────────────
  try {
    const { system: vSys, user: vUsr } = buildVerifyPrompt(questions, theme)
    const verifyRaw = await callDeepSeek(
      [{ role: 'system', content: vSys }, { role: 'user', content: vUsr }],
      0.1, // très basse température = conservateur
      4096
    )

    const verifyParsed = parseJSON(verifyRaw)
    if (verifyParsed) {
      const verifiedRaw = Array.isArray(verifyParsed.questions) ? verifyParsed.questions : []
      if (verifiedRaw.length >= 2) {
        const result = validateAndNormalize(verifiedRaw)
        if (result.questions.length >= 2) {
          questions = result.questions
          errors = [...errors, ...result.errors]
          console.log(`[Étape 2] Après vérification : ${questions.length} questions`)
        }
      }
    }
  } catch (verifyErr) {
    console.warn('[Étape 2] Vérification échouée, on garde les questions de l\'étape 1')
  }

  // ── ÉTAPE 3 : Validation finale ──────────────────────────────────────────
  try {
    const { system: fSys, user: fUsr } = buildFinalCheckPrompt(questions)
    const finalRaw = await callDeepSeek(
      [{ role: 'system', content: fSys }, { role: 'user', content: fUsr }],
      0.05,
      4096
    )

    const finalParsed = parseJSON(finalRaw)
    if (finalParsed && Array.isArray(finalParsed.checks)) {
      const checks = finalParsed.checks as Record<string, unknown>[]
      const toRemove = new Set<string>()

      for (const check of checks) {
        const verdict = check.verdict as string
        const qId = check.questionId as string
        const confidence = Number(check.confidence) || 0

        if (verdict === 'reject' || confidence < 50) {
          toRemove.add(qId)
          console.log(`[Étape 3] Rejetée : ${qId} (confiance: ${confidence}%)`)
        } else if (verdict === 'fix' && check.fixedAnswer !== null && check.fixedAnswer !== undefined) {
          // Corriger la réponse
          const q = questions.find(qq => qq.id === qId)
          if (q) {
            const fixedAnswer = check.fixedAnswer
            if (q.type === 'mcq') {
              const idx = typeof fixedAnswer === 'number' ? fixedAnswer
                : (q.options as string[]).findIndex((o: string) =>
                    o.toLowerCase() === String(fixedAnswer).toLowerCase())
              if (idx >= 0) {
                (q as any).answer = idx
                console.log(`[Étape 3] Corrigée : ${qId} → index ${idx}`)
              }
            } else if (q.type === 'truefalse') {
              (q as any).answer = fixedAnswer === true || fixedAnswer === 'true'
            } else if (q.type === 'fill') {
              (q as any).answer = String(fixedAnswer).trim()
            }
          }
        }
      }

      if (toRemove.size > 0) {
        questions = questions.filter(q => !toRemove.has(q.id as string))
        console.log(`[Étape 3] ${toRemove.size} questions retirées, reste ${questions.length}`)
      }
    }
  } catch (finalErr) {
    console.warn('[Étape 3] Validation finale échouée, on garde les questions de l\'étape 2')
  }

  // Nettoyer les champs internes avant de renvoyer
  const cleanQuestions = questions.map(({ _correctLabel, _optionsCount, ...q }) => q)

  return { questions: cleanQuestions, errors, theme }
}

// ─── Questions de fallback (SI l'IA plante vraiment) ────────────────────────────
function generateFallbackQuestions(count: number): Record<string, unknown>[] {
  // Questions de culture générale VÉRIFIÉES manuellement
  const bank = [
    {
      type: 'mcq',
      prompt: 'Quel est le pays le plus peuplé du monde ?',
      options: ['Inde', 'Chine', 'États-Unis', 'Indonésie'],
      answer: 0,
      explanation: "Depuis 2023, l'Inde a dépassé la Chine avec plus de 1,4 milliard d'habitants."
    },
    {
      type: 'truefalse',
      prompt: "La Grande Muraille de Chine est visible depuis la Lune à l'œil nu.",
      answer: false,
      explanation: "C'est un mythe. Aucune construction humaine n'est visible depuis la Lune à l'œil nu."
    },
    {
      type: 'fill',
      prompt: 'Quel est le symbole chimique de l\'eau ?',
      answer: 'H2O',
      explanation: "L'eau est composée de deux atomes d'hydrogène (H) et un d'oxygène (O)."
    },
    {
      type: 'mcq',
      prompt: 'Qui a peint la Joconde ?',
      options: ['Léonard de Vinci', 'Michel-Ange', 'Raphaël', 'Donatello'],
      answer: 0,
      explanation: "Léonard de Vinci a peint Mona Lisa entre 1503 et 1519."
    },
    {
      type: 'truefalse',
      prompt: "L'Amazonie produit environ 20% de l'oxygène de la Terre.",
      answer: true,
      explanation: "La forêt amazonienne est souvent appelée le 'poumon de la Terre' pour cette raison."
    },
    {
      type: 'mcq',
      prompt: "Quel instrument mesure l'intensité des séismes ?",
      options: ['Sismographe', 'Baromètre', 'Thermomètre', 'Anémomètre'],
      answer: 0,
      explanation: "Le sismographe enregistre les mouvements du sol lors des tremblements de terre."
    },
    {
      type: 'fill',
      prompt: "Combien de continents y a-t-il sur Terre (modèle le plus courant) ?",
      answer: '7',
      explanation: "Les 7 continents sont : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie."
    },
    {
      type: 'mcq',
      prompt: 'En quelle année le mur de Berlin est-il tombé ?',
      options: ['1989', '1990', '1991', '1988'],
      answer: 0,
      explanation: "Le mur de Berlin est tombé le 9 novembre 1989, marquant la fin de la Guerre Froide."
    },
    {
      type: 'truefalse',
      prompt: 'Les humains ont plus de gènes qu\'un grain de riz.',
      answer: false,
      explanation: "Le riz a environ 50 000 gènes, contre environ 20 000 pour l'humain."
    },
    {
      type: 'fill',
      prompt: 'Quelle planète du système solaire est la plus proche du Soleil ?',
      answer: 'mercure',
      explanation: "Mercure orbite à environ 58 millions de km du Soleil."
    },
  ]

  // Mélanger et prendre le compte demandé
  const shuffled = [...bank].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, bank.length)).map((q, i) => ({
    ...q,
    id: `fb-q${i + 1}`,
    prompt: q.prompt,
  }))
}

// ─── Handler principal ──────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: CORS })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: CORS })
    }

    // Rate limit
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const { count: recentCount } = await supabase
      .from('ai_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', windowStart)

    if ((recentCount ?? 0) >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'rate_limit', message: `Limite de ${RATE_LIMIT} parties/heure. Réessaie plus tard.` }),
        { status: 429, headers: CORS }
      )
    }

    // Paramètres
    const body = await req.json()
    const {
      subjectId = 'culture_generale',
      levelId = 'tous',
      questionCount = 8,
      existingCourseLesson = '',
      topic = '',
      secureMode = false,
      courseId,
    } = body

    // Enregistrer l'appel
    await supabase.from('ai_rate_limits').insert({ user_id: user.id })

    // Génération (avec fallback)
    let questions: Record<string, unknown>[] = []
    let errors: string[] = []
    let theme = topic || 'Culture générale'

    try {
      const result = await generateQuestionsWithAI({
        subjectId, levelId, questionCount,
        existingCourseLesson, topic,
      })
      questions = result.questions
      errors = result.errors
      theme = result.theme
    } catch (genErr) {
      console.error('[generate-questions] Échec IA, fallback:', genErr)
      questions = generateFallbackQuestions(questionCount)
      errors = ['Fallback: questions pré-vérifiées (erreur IA)']
    }

    // Mode sécurisé : stocker sans réponses
    if (secureMode && courseId) {
      try {
        await supabase.rpc('store_secure_questions', {
          p_course_id: courseId,
          p_questions: questions,
          p_generated_at: new Date().toISOString()
        })
      } catch { /* ok */ }

      const questionsOnly = questions.map((q: Record<string, unknown>) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        explanation: q.explanation,
      }))

      return new Response(
        JSON.stringify({ questions: questionsOnly, meta: { count: questionsOnly.length, theme } }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        questions,
        meta: {
          count: questions.length,
          theme,
          generatedAt: new Date().toISOString(),
          verified: errors.length === 0,
          warnings: errors.length > 0 ? errors : undefined,
        },
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[generate-questions] Fatal:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur interne', detail: String(err) }),
      { status: 500, headers: CORS }
    )
  }
})
