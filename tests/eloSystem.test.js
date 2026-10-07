import { describe, it, expect } from 'vitest'
import { calculateEloChange, MIN_ELO, INITIAL_ELO, getRankByElo } from '../src/lib/eloSystem.js'

describe('eloSystem', () => {
  it('augmente l\'Elo en cas de victoire contre un adversaire égal', () => {
    const result = calculateEloChange({
      playerElo: 1000,
      opponentElo: 1000,
      won: true,
    })
    expect(result.change).toBeGreaterThan(0)
    expect(result.newElo).toBeGreaterThan(1000)
  })

  it('diminue l\'Elo en cas de défaite contre un adversaire égal', () => {
    const result = calculateEloChange({
      playerElo: 1000,
      opponentElo: 1000,
      won: false,
    })
    expect(result.change).toBeLessThan(0)
    expect(result.newElo).toBeLessThan(1000)
  })

  it('attribue un gain plus élevé face à un adversaire plus fort', () => {
    const vsEqual = calculateEloChange({ playerElo: 1000, opponentElo: 1000, won: true })
    const vsStronger = calculateEloChange({ playerElo: 1000, opponentElo: 1500, won: true })
    expect(vsStronger.change).toBeGreaterThan(vsEqual.change)
  })

  it('ne fait jamais descendre l\'Elo sous MIN_ELO (200)', () => {
    const result = calculateEloChange({
      playerElo: 210,
      opponentElo: 500,
      won: false,
      scoreDifference: -10,
    })
    expect(result.newElo).toBe(MIN_ELO)
    expect(result.change).toBe(-10)
  })

  it('bloque la perte quand le joueur est déjà à MIN_ELO', () => {
    const result = calculateEloChange({
      playerElo: MIN_ELO,
      opponentElo: 800,
      won: false,
    })
    expect(result.newElo).toBe(MIN_ELO)
    expect(result.change).toBe(0)
  })

  it('gère correctement les rangs Elo', () => {
    expect(getRankByElo(200).id).toBe('bronze')
    expect(getRankByElo(1000).id).toBe('silver')
    expect(getRankByElo(1500).id).toBe('gold')
    expect(getRankByElo(2000).id).toBe('platinum')
    expect(getRankByElo(2500).id).toBe('diamond')
    expect(getRankByElo(3000).id).toBe('legend')
  })
})
