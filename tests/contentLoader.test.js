import { describe, it, expect } from 'vitest'
import { COURSES, getRandomQuestionsFromCourses } from '../src/lib/contentLoader.js'

describe('contentLoader tests for all subjects in Seconde', () => {
  it('samples questions for maths', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'maths', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'maths')).toBe(true)
  })

  it('samples questions for physique', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'physique', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'physique')).toBe(true)
  })

  it('samples questions for svt', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'svt', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'svt')).toBe(true)
  })

  it('samples questions for histoire', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'histoire', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'histoire')).toBe(true)
  })

  it('samples questions for francais', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'francais', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'francais')).toBe(true)
  })

  it('samples questions for anglais', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'anglais', levelId: 'seconde', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'anglais')).toBe(true)
  })

  it('samples questions for terminale maths', () => {
    const q = getRandomQuestionsFromCourses({ subjectId: 'maths', levelId: 'terminale', count: 8 })
    expect(q.length).toBe(8)
    expect(q.every(item => item.subject === 'maths')).toBe(true)
    expect(q.every(item => item.level === 'terminale')).toBe(true)
    // Aucun numéro de page ni question méta de manuel
    expect(q.every(item => !item.prompt.match(/\bpage\s+0?\d+/i))).toBe(true)
    expect(q.every(item => !item.prompt.match(/quel chapitre traite/i))).toBe(true)
  })
})
