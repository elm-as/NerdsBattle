import { describe, it, expect } from 'vitest'
import { checkAnswer, scoreQuiz } from '../src/lib/quizEngine.js'

describe('quizEngine', () => {
  describe('checkAnswer', () => {
    it('valide correctement les QCM (mcq)', () => {
      const q = { type: 'mcq', answer: 2, options: ['A', 'B', 'C', 'D'] }
      expect(checkAnswer(q, 2)).toBe(true)
      expect(checkAnswer(q, '2')).toBe(true)
      expect(checkAnswer(q, 0)).toBe(false)
      expect(checkAnswer(q, null)).toBe(false)
    })

    it('valide correctement le Vrai/Faux (truefalse)', () => {
      const qTrue = { type: 'truefalse', answer: true }
      expect(checkAnswer(qTrue, true)).toBe(true)
      expect(checkAnswer(qTrue, 'true')).toBe(true)
      expect(checkAnswer(qTrue, false)).toBe(false)

      const qFalse = { type: 'truefalse', answer: false }
      expect(checkAnswer(qFalse, false)).toBe(true)
      expect(checkAnswer(qFalse, true)).toBe(false)
    })

    it('valide les réponses à trous avec normalisation (accents, casse, espaces)', () => {
      const q = {
        type: 'fill',
        answer: 'Photosynthèse',
        acceptedAnswers: ['la photosynthese', 'photosynthese'],
      }
      expect(checkAnswer(q, 'photosynthèse')).toBe(true)
      expect(checkAnswer(q, 'PHOTOSYNTHESE')).toBe(true)
      expect(checkAnswer(q, '  Photosynthèse  ')).toBe(true)
      expect(checkAnswer(q, 'la photosynthese')).toBe(true)
      expect(checkAnswer(q, 'respiration')).toBe(false)
    })
  })

  describe('scoreQuiz', () => {
    it('calcule un score et une précision exacts', () => {
      const course = {
        questions: [
          { id: 'q1', type: 'mcq', answer: 0 },
          { id: 'q2', type: 'mcq', answer: 1 },
          { id: 'q3', type: 'truefalse', answer: true },
          { id: 'q4', type: 'fill', answer: 'Newton' },
        ],
      }
      const answers = {
        q1: 0,
        q2: 1,
        q3: true,
        q4: 'newton',
      }
      const result = scoreQuiz(course, answers)
      expect(result.correctCount).toBe(4)
      expect(result.total).toBe(4)
      expect(result.accuracy).toBe(1)
      expect(result.score).toBe(100)
    })

    it('gère les fautes partielles', () => {
      const course = {
        questions: [
          { id: 'q1', type: 'mcq', answer: 0 },
          { id: 'q2', type: 'mcq', answer: 1 },
        ],
      }
      const answers = {
        q1: 0,
        q2: 0, // faux
      }
      const result = scoreQuiz(course, answers)
      expect(result.correctCount).toBe(1)
      expect(result.total).toBe(2)
      expect(result.accuracy).toBe(0.5)
      expect(result.score).toBe(50)
    })
  })
})
