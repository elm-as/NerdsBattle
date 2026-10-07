import 'katex/dist/katex.min.css'
import katex from 'katex'

const KATEX_OPTS = {
  trust: false,
  strict: 'warn',
  throwOnError: false
}

function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, { ...KATEX_OPTS, displayMode })
  } catch {
    return `<code>${tex}</code>`
  }
}

/**
 * Rend du texte contenant du LaTeX :
 *   $$...$$  → bloc centré (display mode)
 *   $...$    → inline
 *   Le reste → texte brut
 */
export default function MathText({ children, className = '' }) {
  if (!children && children !== 0) return null
  const text = String(children)

  if (!text.includes('$')) {
    return <span className={className}>{text}</span>
  }

  // Tokeniser : $$...$$ puis $...$
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
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: renderMath(t.value, true) }}
            />
          )
        }
        return (
          <span
            key={i}
            className="inline-block"
            dangerouslySetInnerHTML={{ __html: renderMath(t.value, false) }}
          />
        )
      })}
    </span>
  )
}
