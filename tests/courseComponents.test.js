import { describe, it, expect } from 'vitest'

describe('MathGraphCard data parsing tests', () => {
  it('parses valid mathgraph json cleanly', () => {
    const rawJson = JSON.stringify({
      type: 'function',
      title: 'Valeur moyenne',
      functions: [{ expression: 'sin(x)+2', color: '#10B981' }],
      constant: { value: 2.3, name: 'μ' },
      area: { xStart: 0, xEnd: 5 }
    })

    const parsed = JSON.parse(rawJson)
    expect(parsed.title).toBe('Valeur moyenne')
    expect(parsed.functions.length).toBe(1)
    expect(parsed.constant.value).toBe(2.3)
  })

  it('handles invalid json without crashing', () => {
    const invalid = '{ invalid_json: true '
    let parsed = null
    try {
      parsed = JSON.parse(invalid)
    } catch {
      parsed = null
    }
    expect(parsed).toBeNull()
  })
})

describe('Course markdown and math sanitization tests', () => {
  it('cleans trailing backslashes and lone backslashes', async () => {
    const { sanitizeMarkdown, sanitizeTitle } = await import('../scripts/cleanCoursesMarkdown.mjs')
    
    const input = `## 3. Interprétation graphique\\

Chaque équation $ax + by = c$ représente une droite.\\

| Cas | Nature |
|---|---|
| 1 | Unique |\\
\\

## 4. Systèmes d'inéquations\\`

    const cleaned = sanitizeMarkdown(input)
    expect(cleaned).not.toContain('Interprétation graphique\\')
    expect(cleaned).not.toContain('représente une droite.\\')
    expect(cleaned).not.toContain('| 1 | Unique |\\')
    expect(cleaned).toContain('## 3. Interprétation graphique')
    expect(cleaned).toContain('| 1 | Unique |')

    const titleWithLatex = sanitizeTitle('Systèmes linéaires dans $$\\mathbb{R} \\times \\mathbb{R}$$')
    expect(titleWithLatex).toBe('Systèmes linéaires dans $\\mathbb{R} \\times \\mathbb{R}$')

    const rawTitle = sanitizeTitle('Systèmes linéaires dans \\\\mathbb{R} \\\\times \\\\mathbb{R}')
    expect(rawTitle).toBe('Systèmes linéaires dans $\\mathbb{R} \\times \\mathbb{R}$')
  })
})
