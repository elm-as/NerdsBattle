// Leaderboard : uniquement Supabase, pas de mock

import { supabase } from './supabase.js'

/**
 * Charge le leaderboard depuis Supabase.
 * Retourne [] si vide ou null si erreur.
 * 
 * Scopes supportés:
 * - 'world': Classement mondial global
 * - 'country': Classement par pays (nécessite countryCode)
 * - 'level': Classement par niveau scolaire (nécessite levelId)
 * - 'subject': Classement par matière (nécessite subjectId)
 */
export async function fetchLeaderboard({ scope = 'world', levelId, countryCode, subjectId, limit = 50 } = {}) {
  if (!supabase) return null
  try {
    // Cas spécial : classement par matière utilise une vue différente
    if (scope === 'subject' && subjectId) {
      const { data, error } = await supabase
        .from('leaderboard_by_subject')
        .select('id, name, avatar_seed, avatar_url, level_id, country, subject_id, elo, elo_rank, wins, losses, win_rate, rank')
        .eq('subject_id', subjectId)
        .limit(limit)

      if (error) {
        console.error('Erreur leaderboard par matière:', error)
        return null
      }
      if (!data?.length) return []

      const sorted = [...data].sort((a, b) => {
        if ((b.elo ?? 0) !== (a.elo ?? 0)) return (b.elo ?? 0) - (a.elo ?? 0)
        if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0)
        if ((b.win_rate ?? 0) !== (a.win_rate ?? 0)) return (b.win_rate ?? 0) - (a.win_rate ?? 0)
        return (a.name || '').localeCompare(b.name || '')
      })

      return sorted.map((p, index) => ({
        id:         p.id,
        name:       p.name || 'Anonyme',
        avatarUrl:  p.avatar_url || null,
        avatarSeed: p.avatar_seed || null,
        country:    p.country || 'FR',
        levelId:    p.level_id || 'seconde',
        elo:        p.elo || 400,
        eloRank:    p.elo_rank || 'bronze',
        wins:       p.wins || 0,
        losses:     p.losses || 0,
        winRate:    p.win_rate || 0,
        rank:       index + 1,
        subjectId:  p.subject_id,
      }))
    }

    // Classement global (world, country, level) - CLASSEMENT PAR ELO
    let q = supabase
      .from('leaderboard')
      .select('id, name, avatar_seed, avatar_url, level_id, country, elo, elo_rank, wins, losses, win_rate, rank')
      .limit(limit)

    if (scope === 'level' && levelId)       q = q.eq('level_id', levelId)
    if (scope === 'country' && countryCode) q = q.eq('country', countryCode)

    const { data, error } = await q
    if (error) {
      console.error('Erreur leaderboard:', error)
      return null
    }
    // Trier proprement avec départage déterministe (Elo -> Victoires -> Win Rate -> Nom)
    const sorted = [...data].sort((a, b) => {
      if ((b.elo ?? 0) !== (a.elo ?? 0)) return (b.elo ?? 0) - (a.elo ?? 0)
      if ((b.wins ?? 0) !== (a.wins ?? 0)) return (b.wins ?? 0) - (a.wins ?? 0)
      if ((b.win_rate ?? 0) !== (a.win_rate ?? 0)) return (b.win_rate ?? 0) - (a.win_rate ?? 0)
      return (a.name || '').localeCompare(b.name || '')
    })

    return sorted.map((p, index) => ({
      id:         p.id,
      name:       p.name || 'Anonyme',
      avatarUrl:  p.avatar_url || null,
      avatarSeed: p.avatar_seed || null,
      country:    p.country || 'FR',
      levelId:    p.level_id || 'seconde',
      elo:        p.elo || 400,
      eloRank:    p.elo_rank || 'bronze',
      wins:       p.wins || 0,
      losses:     p.losses || 0,
      winRate:    p.win_rate || 0,
      rank:       index + 1,
    }))
  } catch (err) {
    console.error('Erreur fetchLeaderboard:', err)
    return null
  }
}

// Fonction vide pour compatibilité - plus de mock
export function getLeaderboard() {
  console.warn('getLeaderboard (mock) est déprécié - utilise fetchLeaderboard')
  return []
}
