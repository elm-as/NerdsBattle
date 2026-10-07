import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { recordQuiz } from '../lib/storage.js'
import { useAuth } from './AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getRankByXp } from '../data/ranks.js'
import LevelUpModal from '../components/ui/LevelUpModal.jsx'

const UserContext = createContext(null)

// État initial vide - tout charge depuis Supabase
const defaultState = {
  user: null,
  theme: 'light',
  streak: { count: 0, lastDay: null },
  history: [],
  totalXp: 0
}

export function UserProvider({ children }) {
  const [state, setState] = useState(defaultState)
  const [loading, setLoading] = useState(true)
  const [levelUpRank, setLevelUpRank] = useState(null)
  const { session, profile: supabaseProfile, loading: authLoading } = useAuth()
  const isLoggedIn = !!session?.user

  // Synchroniser depuis Supabase quand connecté
  useEffect(() => {
    console.log('UserContext sync:', { isLoggedIn, hasProfile: !!supabaseProfile, profileLevelId: supabaseProfile?.level_id })
    
    // Tant que l'authentification charge la session ou le profil, maintenir loading = true
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!isLoggedIn) {
      // Pas connecté, pas besoin de charger le profil
      setLoading(false)
      return
    }
    
    if (!supabaseProfile) {
      // Connecté mais aucun profil trouvé (nouvel utilisateur)
      setLoading(false)
      return
    }

    // Fusionner les données Supabase avec le state local
    setState((s) => {
      const newState = {
        ...s,
        user: {
          ...(s.user || {}),
          id: supabaseProfile.id,
          name: supabaseProfile.name,
          levelId: supabaseProfile.level_id,
          country: supabaseProfile.country,
          subjects: supabaseProfile.subjects || [],
          avatarSeed: supabaseProfile.avatar_seed,
          avatarUrl: supabaseProfile.avatar_url,
          // Système Elo (Elo initial : 400 = Bronze)
          elo: supabaseProfile.elo || 400,
          eloRank: supabaseProfile.elo_rank || 'bronze',
          wins: supabaseProfile.wins || 0,
          losses: supabaseProfile.losses || 0
        },
        streak: {
          count: supabaseProfile.streak_count || 0,
          lastDay: supabaseProfile.streak_last
        },
        totalXp: supabaseProfile.total_xp || 0
      }
      console.log('UserContext new state:', { levelId: newState.user?.levelId })
      return newState
    })
    
    setLoading(false)

    // Charger l'historique depuis Supabase
    loadHistoryFromSupabase(session.user.id)
  }, [isLoggedIn, supabaseProfile, authLoading])

  const loadHistoryFromSupabase = async (userId) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erreur chargement historique:', error)
      return
    }

    if (data) {
      const history = data.map(h => ({
        courseId: h.course_id,
        subjectId: h.subject_id,
        levelId: h.level_id,
        mode: h.mode,
        ranked: h.ranked,
        score: h.score,
        accuracy: h.accuracy,
        correct: h.correct,
        total: h.total,
        xpGain: h.xp_gain,
        at: new Date(h.played_at).getTime()
      }))

      setState((s) => ({ ...s, history }))
    }
  }

  const updateUser = useCallback((patch) => {
    setState((s) => ({ ...s, user: { ...(s.user || {}), ...patch } }))

    // Si connecté, synchroniser avec Supabase
    if (isLoggedIn && supabase) {
      const updateData = {}
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.levelId !== undefined) updateData.level_id = patch.levelId
      if (patch.country !== undefined) updateData.country = patch.country
      if (patch.subjects !== undefined) updateData.subjects = patch.subjects
      if (patch.avatarSeed !== undefined) updateData.avatar_seed = patch.avatarSeed
      if (patch.avatarUrl !== undefined) updateData.avatar_url = patch.avatarUrl

      if (Object.keys(updateData).length > 0) {
        supabase.from('profiles').update(updateData).eq('id', session.user.id).then()
      }
    }
  }, [isLoggedIn, session])

  const completeOnboarding = useCallback((profile) => {
    setState((s) => ({
      ...s,
      user: {
        id: profile.id || s.user?.id || crypto.randomUUID(),
        name: profile.name || 'Toi',
        avatarSeed: profile.avatarSeed || Math.random().toString(36).slice(2, 8),
        subjects: profile.subjects || [],
        ...profile
      }
    }))
  }, [])

  const submitQuiz = useCallback(async (entry) => {
    let xpData = {}
    let nextState = null

    setState((s) => {
      const oldRank = getRankByXp(s.totalXp || 0)
      nextState = recordQuiz(s, entry)
      xpData = nextState._lastXp || {}
      
      const newRank = getRankByXp(nextState.totalXp || 0)
      if (oldRank.id !== newRank.id && (nextState.totalXp || 0) > (s.totalXp || 0)) {
        setLevelUpRank(newRank)
      }
      
      return nextState
    })

    // Si connecté, synchroniser avec Supabase
    if (isLoggedIn && supabase && nextState) {
      const today = new Date().toISOString().slice(0, 10)

      // Mettre à jour le profil avec les nouvelles stats
      await supabase.from('profiles').update({
        streak_count: nextState.streak.count,
        streak_last: nextState.streak.lastDay,
        total_xp: nextState.totalXp
      }).eq('id', session.user.id)

      // Ajouter l'entrée à quiz_history
      await supabase.from('quiz_history').insert({
        user_id: session.user.id,
        course_id: entry.courseId,
        subject_id: entry.subjectId,
        level_id: entry.levelId,
        mode: entry.mode || 'solo',
        ranked: entry.ranked !== false,
        score: entry.score || 0,
        accuracy: entry.accuracy || 0,
        correct: entry.correct || 0,
        total: entry.total || 0,
        xp_gain: xpData.xpGain || 0,
        // Système Elo
        elo_change: entry.eloChange || 0,
        new_elo: entry.newElo || null
      })

      // Mettre à jour l'XP par matière (pour le classement par matière)
      if (entry.subjectId && xpData.xpGain > 0) {
        await supabase.rpc('update_subject_xp', {
          p_user_id: session.user.id,
          p_subject_id: entry.subjectId,
          p_xp_to_add: xpData.xpGain
        })
      }
      
      // Mettre à jour l'Elo et les stats PvP si c'était un battle
      if (entry.mode === '1v1' || entry.mode === '2v2') {
        const profileUpdates = {}
        if (entry.newElo !== undefined) profileUpdates.elo = entry.newElo
        
        if (Object.keys(profileUpdates).length > 0) {
          await supabase.from('profiles').update(profileUpdates).eq('id', session.user.id)
        }
        
        // Mettre à jour wins/losses séparément via RPC pour éviter race conditions
        if (entry.battleWin) {
          await supabase.rpc('increment_wins', { p_user_id: session.user.id })
        } else {
          await supabase.rpc('increment_losses', { p_user_id: session.user.id })
        }
      }
    }

    return xpData
  }, [isLoggedIn, session])

  const reset = useCallback(() => {
    // Reset local seulement - les données Supabase restent
    setState(defaultState)
  }, [])

  return (
    <UserContext.Provider
      value={{ ...state, updateUser, completeOnboarding, submitQuiz, reset, loading }}
    >
      {children}
      <LevelUpModal rank={levelUpRank} onClose={() => setLevelUpRank(null)} />
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
