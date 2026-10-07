import { describe, it, expect } from 'vitest'
import { computeXpGain, getAntiSpamMessage } from '../src/lib/xpEngine.js'

describe('xpEngine', () => {
  it('calcule un gain XP valide pour un quiz solo réussi', () => {
    const { total, breakdown } = computeXpGain({
      correctCount: 8,
      total: 8,
      levelId: 'seconde',
      mode: 'solo',
      ranked: true,
    })
    expect(total).toBeGreaterThan(50)
    expect(breakdown.questions).toBeGreaterThan(0)
    expect(breakdown.perfect).toBe(20)
  })

  it('applique un multiplicateur plus fort pour les niveaux avancés', () => {
    const sixieme = computeXpGain({
      correctCount: 5, total: 5, levelId: 'sixieme', mode: 'solo', ranked: true,
    })
    const terminale = computeXpGain({
      correctCount: 5, total: 5, levelId: 'terminale', mode: 'solo', ranked: true,
    })
    expect(terminale.total).toBeGreaterThan(sixieme.total)
  })

  it('applique un bonus de victoire en battle', () => {
    const withWin = computeXpGain({
      correctCount: 6, total: 8, levelId: 'seconde', mode: '1v1', battleWin: true, ranked: true,
    })
    const withoutWin = computeXpGain({
      correctCount: 6, total: 8, levelId: 'seconde', mode: '1v1', battleWin: false, ranked: true,
    })
    expect(withWin.total).toBeGreaterThan(withoutWin.total)
    expect(withWin.breakdown.battleWin).toBe(15)
  })

  it('applique le diminishing returns anti-spam sur les répétitions', () => {
    const courseId = 'course-test'
    const firstPlay = computeXpGain({
      correctCount: 5, total: 5, levelId: 'seconde', mode: 'solo', courseId, courseHistory: [], ranked: true,
    })
    const fifthPlay = computeXpGain({
      correctCount: 5, total: 5, levelId: 'seconde', mode: 'solo', courseId, courseHistory: [courseId, courseId, courseId, courseId], ranked: true,
    })
    expect(firstPlay.total).toBeGreaterThan(fifthPlay.total)
    expect(fifthPlay.antiSpam).toBeLessThan(firstPlay.antiSpam)
  })

  it('retourne le message anti-spam adéquat', () => {
    expect(getAntiSpamMessage(0)).toBeNull()
    expect(getAntiSpamMessage(1)).toContain('-40%')
    expect(getAntiSpamMessage(4)).toContain('-95%')
  })
})
