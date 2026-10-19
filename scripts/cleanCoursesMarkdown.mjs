import fs from 'fs'
import path from 'path'

function walk(dir) {
  let files = []
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full))
    else if (full.endsWith('.json')) files.push(full)
  }
  return files
}

/**
 * Nettoie en profondeur le markdown et le LaTeX pour un rendu impeccable.
 */
export function sanitizeMarkdown(text) {
  if (typeof text !== 'string' || !text) return text

  let s = text

  // 1. Normaliser les retours chariot et sauts de ligne échappés
  s = s.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n')

  // 2. Corriger les artefacts d'échappement accidentel (\t -> tab, \n -> newline sur LaTeX)
  s = s.replace(/\t(imes\b)/g, '\\t$1')
  s = s.replace(/\t(ext\b)/g, '\\t$1')
  s = s.replace(/\t(an\b)/g, '\\t$1')
  s = s.replace(/\t(heta\b)/g, '\\t$1')
  s = s.replace(/\t(au\b)/g, '\\t$1')
  s = s.replace(/\t(o\b)/g, '\\t$1')

  // Corriger les coupures \neq, \nu, \rightarrow
  s = s.replace(/\\\s*\n\s*eq\b/g, '\\neq ')
  s = s.replace(/\\\s*\n\s*u\b/g, '\\nu ')
  s = s.replace(/\\\s*\n\s*rightarrow\b/g, '\\rightarrow ')

  // 3. Dé-doubler les backslashes devant les commandes LaTeX standard
  s = s.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1')

  // 4. Traitement ligne par ligne pour les trailing backslashes et tableaux
  const lines = s.split('\n')
  const cleanedLines = []
  let inMultilineLatex = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (line.includes('\\begin{') && !line.includes('\\end{')) {
      inMultilineLatex = true
    } else if (line.includes('\\end{')) {
      inMultilineLatex = false
    }

    // Supprimer les lignes ne contenant qu'un antislash
    if (/^\s*\\+\s*$/.test(line)) {
      cleanedLines.push('')
      continue
    }

    // Lignes de tableau GFM : "| ... |\" -> "| ... |"
    if (/^\s*\|.*\|\s*\\+\s*$/.test(line)) {
      line = line.replace(/\|\s*\\+\s*$/, '|')
    }
    // Ligne se terminant par $$\ : "$$...$$\" -> "$$...$$"
    else if (/\$\$\s*\\+\s*$/.test(line)) {
      line = line.replace(/\$\$\s*\\+\s*$/, () => '$$')
    }
    // Hors bloc LaTeX multiligne : supprimer les backslashes traînants
    else if (!inMultilineLatex) {
      line = line.replace(/([^\\])\\+$/, '$1').trimEnd()
    }

    // Réparer les lignes de formule commençant par $$ mais terminées par un seul $
    if (line.trim().startsWith('$$') && line.trim().endsWith('$') && !line.trim().endsWith('$$')) {
      line = line.trim() + '$'
    }

    cleanedLines.push(line)
  }

  s = cleanedLines.join('\n')

  // 5. Normaliser les tableaux GFM : ligne vide OBLIGATOIRE avant et après
  s = s.replace(/([^\n])\n(\|[^\n]+\|\r?\n\|[-:| ]+\|)/g, '$1\n\n$2')
  s = s.replace(/(\|[^\n]+\|)\n([^\n|#\s])/g, '$1\n\n$2')

  // 6. Supprimer les lignes d'antislash orphelines restantes
  s = s.replace(/\n\s*\\+\s*\n/g, '\n\n')

  // 7. Limiter les sauts de ligne multiples consécutifs
  s = s.replace(/\n{4,}/g, '\n\n\n')

  return s
}

/**
 * Normalise un titre de cours pour un affichage typographique parfait
 */
export function sanitizeTitle(title) {
  if (typeof title !== 'string' || !title) return title

  let t = title.trim()

  // Dé-doubler les backslashes : \\mathbb -> \mathbb, \\times -> \times
  t = t.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1')

  // Remplacer les expressions courantes sans délimiteur
  if (!t.includes('$')) {
    t = t.replace(/\\mathbb\{R\}\s*\\?times\s*\\mathbb\{R\}/g, '$\\mathbb{R} \\times \\mathbb{R}$')
  }

  // Convertir d'éventuels $$...$$ en $...$ dans les titres (toujours inline)
  t = t.replace(/\$\$+([\s\S]+?)\$\$+/g, (_, inner) => `$${inner}$`)

  // Supprimer les backslashes traînants
  t = t.replace(/\\+$/, '').trim()

  return t
}

// Exécution sur tous les fichiers du dossier courses si appelé directement en CLI
const isDirectCli = process.argv[1] && process.argv[1].includes('cleanCoursesMarkdown')
if (isDirectCli) {
  const allFiles = walk('src/data/courses')
  let modifiedCount = 0

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const json = JSON.parse(content)
    let changed = false

    function processField(val) {
      if (typeof val !== 'string') return val
      const cleaned = sanitizeMarkdown(val)
      if (cleaned !== val) {
        changed = true
        return cleaned
      }
      return val
    }

    // Traiter le titre
    if (json.title) {
      const t = sanitizeTitle(json.title)
      if (t !== json.title) {
        json.title = t
        changed = true
      }
    }

    // Traiter la leçon
    if (json.lesson) json.lesson = processField(json.lesson)

    // Traiter le résumé
    if (json.summary) json.summary = processField(json.summary)

    // Traiter les points clés
    if (Array.isArray(json.keyPoints)) {
      json.keyPoints = json.keyPoints.map(processField)
    }

    // Traiter l'exercice
    if (json.exercise) {
      if (json.exercise.question) json.exercise.question = processField(json.exercise.question)
      if (json.exercise.answer) json.exercise.answer = processField(json.exercise.answer)
    }

    // Traiter les questions QCM
    if (Array.isArray(json.questions)) {
      for (const q of json.questions) {
        if (q.prompt) q.prompt = processField(q.prompt)
        if (q.explanation) q.explanation = processField(q.explanation)
        if (Array.isArray(q.options)) q.options = q.options.map(processField)
      }
    }

    if (changed) {
      fs.writeFileSync(file, JSON.stringify(json, null, 2), 'utf8')
      modifiedCount++
    }
  }

  console.log(`[cleanCoursesMarkdown] ${modifiedCount} fichiers mis à jour et nettoyés avec succès.`)
}
