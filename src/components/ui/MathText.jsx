import 'katex/dist/katex.min.css'
import katex from 'katex'

const KATEX_OPTS = {
  trust: false,
  strict: false,
  throwOnError: false
}

/**
 * Nettoie une chaîne TeX des artefacts fréquents (doubles antislashs, etc.)
 */
function cleanTeX(tex) {
  if (!tex) return ''
  return String(tex)
    .replace(/\\{2,}([a-zA-Z]+)/g, '\\$1')
    .replace(/\\{2,}([{}])/g, '$1')
    .trim()
}

/**
 * Rend du LaTeX via KaTeX de façon sécurisée
 */
function renderMath(tex, displayMode = false) {
  try {
    const cleaned = cleanTeX(tex)
    return katex.renderToString(cleaned, { ...KATEX_OPTS, displayMode })
  } catch {
    return `<span>${tex}</span>`
  }
}

/**
 * Détecte si une chaîne sans délimiteur $ ressemble fortement à une formule mathématique
 */
function isRawMathExpression(str) {
  if (!str) return false
  const s = str.trim()
  // Détecte les commandes LaTeX ou les expressions algébriques typiques
  const hasLatexCommand = /\\[a-zA-Z]+/.test(s)
  const hasSubOrSup = /[\w\d]+[\^_]\{?[^\s}]+\}?/.test(s)
  const isEquation = /^[\w\d\\_{}^+\-*/().=,\s]+$/.test(s) && (hasLatexCommand || hasSubOrSup || /[=<>≤≥±×÷]/.test(s))
  return hasLatexCommand || (hasSubOrSup && isEquation)
}

/**
 * Normalise les délimiteurs alternatifs LaTeX (\(...\) et \[...\]) vers $...$
 */
function normalizeDelimiters(text) {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, '$$$$1$$$')
    .replace(/\\\(([\s\S]+?)\\\)/g, '$$$1$$')
}

/**
 * Prépare et auto-enveloppe les expressions LaTeX orphelines dans un texte
 */
function prepareMathInText(input) {
  if (!input) return ''
  let text = String(input)

  // Dé-doubler les backslashes devant les commandes LaTeX : \\mathbb -> \mathbb, \\times -> \times
  text = text.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1')

  // Normaliser les délimiteurs alternatifs LaTeX \(...\) et \[...\]
  text = normalizeDelimiters(text)

  // Traiter les fragments hors délimiteurs $
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$(?:[^$\\]|\\.)+?\$)/g)

  for (let i = 0; i < parts.length; i += 2) {
    if (!parts[i]) continue
    let segment = parts[i]

    // Formules avec exposant / indice hors $ : x^2 + y^2 = r^2
    segment = segment.replace(/([0-9a-zA-Z]+[\^_]\{?[^{}\s]+\}?(?:\s*[=<>≤≥]\s*[0-9a-zA-Z]+)?)/g, '$$$1$$')

    // Séquences de commandes LaTeX (ex: \mathbb{R} \times \mathbb{R}, \frac{a}{b}, \vec{u})
    const commandRegex = /(\\[a-zA-Z]+(?:\{[^{}]*\})?(?:\s*(?:[\^_]\{?[^{}\s]+\}?|[+\-*/=<>≤≥±×÷·]|\\times|\\cdot|\\in|\\subset|\\cup|\\cap|\\to|\\rightarrow|\\leq|\\geq|\\neq)\s*(?:\\[a-zA-Z]+(?:\{[^{}]*\})?|[a-zA-Z0-9]+(?:\{[^{}]*\})?|[0-9]+))*)/g

    segment = segment.replace(commandRegex, (m) => {
      const trimmed = m.trim()
      if (!trimmed) return m
      return `$${trimmed}$`
    })

    parts[i] = segment
  }

  return parts.join('')
}

/**
 * Composant de rendu mathématique professionnel (KaTeX)
 * Prend en charge:
 *   - $$...$$ (bloc centré)
 *   - $...$ (inline)
 *   - \(...\) et \[...\] (syntaxe LaTeX standard)
 *   - Expressions mathématiques sans délimiteur (ex: t=\frac{\ln 4}{2}, 3e^{2t}=12)
 */
export default function MathText({ children, className = '' }) {
  if (!children && children !== 0) return null
  const rawText = String(children).trim()

  // 1. Si le texte entier est une expression mathématique sans délimiteur
  if (!rawText.includes('$') && !rawText.includes('\\(') && !rawText.includes('\\[') && isRawMathExpression(rawText)) {
    return (
      <span
        className={`inline-block align-middle ${className}`}
        dangerouslySetInnerHTML={{ __html: renderMath(rawText, false) }}
      />
    )
  }

  // 2. Normaliser les délimiteurs et auto-envelopper les expressions orphelines
  const text = prepareMathInText(rawText)

  if (!text.includes('$')) {
    return <span className={className}>{text}</span>
  }

  // 3. Tokeniser les blocs $$...$$ et inline $...$
  const tokens = []
  const re = /(\$\$([\s\S]+?)\$\$|\$((?:[^$\\]|\\.)+?)\$)/g
  let last = 0
  let m

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) })
    if (m[0].startsWith('$$')) {
      tokens.push({ type: 'block', value: m[2] })
    } else {
      tokens.push({ type: 'inline', value: m[3] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })

  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.type === 'text') return <span key={i}>{t.value}</span>
        if (t.type === 'block') {
          return (
            <span
              key={i}
              className="block my-2.5 max-w-full overflow-x-auto py-1 scrollbar-none text-center"
              dangerouslySetInnerHTML={{ __html: renderMath(t.value, true) }}
            />
          )
        }
        return (
          <span
            key={i}
            className="inline-block align-middle px-0.5 max-w-full overflow-x-auto scrollbar-none"
            dangerouslySetInnerHTML={{ __html: renderMath(t.value, false) }}
          />
        )
      })}
    </span>
  )
}
