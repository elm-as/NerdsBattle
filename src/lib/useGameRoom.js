/**
 * useGameRoom — gère le cycle de vie d'une room de matchmaking temps réel.
 *
 * Flow :
 *  1. findOrCreate() → cherche une room 'waiting' compatible (< 2 min), ou en crée une
 *  2. Le host génère les questions IA et les écrit dans room.questions
 *  3. Le guest rejoint → room passe à 'ready' → les deux reçoivent questions
 *  4. Pendant le quiz : broadcast des scores via Realtime channel
 *  5. Fin : room passe à 'done'
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

/** Durée max (en secondes) pour considérer une room comme "fraîche" */
const ROOM_FRESHNESS_SEC = 120

export function useGameRoom({ mode, subjectId, levelId, topic, userId, userName, userAvatar, userAvatarSeed, userTotalXp, enabled, roomIdOverride }) {
  const [room, setRoom]           = useState(null)
  const [roomStatus, setRoomStatus] = useState('idle')
  const [opponentName, setOpponentName] = useState(null)
  const [opponentAvatar, setOpponentAvatar] = useState(null)
  const [opponentAvatarSeed, setOpponentAvatarSeed] = useState(null)
  const [opponentScore, setOpponentScore] = useState(0)
  const channelRef = useRef(null)
  const roomIdRef  = useRef(roomIdOverride || null)
  const subscribedRef = useRef(false)   // empêche les re-subscriptions

  // ── Cherche une room ouverte, sinon en crée une ──────────────────────────
  const findOrCreate = useCallback(async () => {
    if (!supabase || !userId) return null
    setRoomStatus('searching')

    // Seuil de fraîcheur : ne matcher que des rooms récentes
    const freshThreshold = new Date(Date.now() - ROOM_FRESHNESS_SEC * 1000).toISOString()

    // Base query builder — rooms fraîches seulement
    const buildQuery = () => supabase
      .from('game_rooms')
      .select('*')
      .eq('mode', mode)
      .eq('subject_id', subjectId)
      .eq('status', 'waiting')
      .is('guest_id', null)
      .neq('host_id', userId)
      .gte('created_at', freshThreshold)
      .order('created_at', { ascending: true })
      .limit(1)
    
    // Essayer d'abord avec le même niveau
    const { data: sameLevelArr } = await buildQuery().eq('level_id', levelId)
    let existing = sameLevelArr?.[0]

    // Si pas trouvé, chercher n'importe quel niveau (toujours frais)
    if (!existing) {
      const { data: anyLevelArr } = await buildQuery()
      existing = anyLevelArr?.[0]
    }

    if (existing) {
      console.log('findOrCreate: room trouvée, tentative de join:', existing.id)

      // Rejoindre comme guest
      // Le trigger update_room_player_data remplira guest_name/avatar/xp/seed
      // depuis la table profiles (source de vérité, anti-triche)
      const { data: updatedRows, error } = await supabase
        .from('game_rooms')
        .update({
          guest_id: userId,
          status: 'ready'
        })
        .eq('id', existing.id)
        .eq('status', 'waiting')   // guard race condition
        .is('guest_id', null)      // guard supplémentaire : pas déjà prise
        .select()

      console.log('findOrCreate: résultat PATCH:', { 
        updatedRowsCount: updatedRows?.length, 
        error: error?.message,
        errorCode: error?.code 
      })

      // Si on a exactement 1 ligne modifiée, on a rejoint avec succès
      if (!error && updatedRows && updatedRows.length === 1) {
        const updated = updatedRows[0]
        console.log('findOrCreate: rejoint room avec succès:', updated.id)
        roomIdRef.current = updated.id
        setRoom(updated)
        setRoomStatus('ready')
        setOpponentName(updated.host_name || 'Adversaire')
        setOpponentAvatar(updated.host_avatar || null)
        setOpponentAvatarSeed(updated.host_avatar_seed || null)
        subscribeToRoom(updated.id)
        return updated
      }
      console.log('findOrCreate: race condition, room déjà prise, on crée une nouvelle')
      // Sinon: race condition, on continue pour créer une nouvelle room
    }

    // Créer une nouvelle room (host)
    // Le trigger update_room_player_data remplira host_name/avatar/xp/seed
    // depuis la table profiles (source de vérité, anti-triche)
    console.log('findOrCreate: création d\'une nouvelle room...')
    const { data: created, error: createErr } = await supabase
      .from('game_rooms')
      .insert({
        mode,
        subject_id: subjectId,
        level_id:   levelId,
        topic:      topic || '',
        host_id:    userId,
        status:     'waiting',
      })
      .select()
      .single()

    console.log('findOrCreate: résultat création:', { 
      created: !!created, 
      id: created?.id,
      error: createErr?.message 
    })

    if (createErr || !created) {
      console.error('findOrCreate: erreur création room:', createErr)
      setRoomStatus('error')
      return null
    }

    roomIdRef.current = created.id
    setRoom(created)
    setRoomStatus('waiting')
    subscribeToRoom(created.id)
    return created
  }, [mode, subjectId, levelId, topic, userId])

  // ── S'abonner aux changements d'une room (appelé une seule fois) ─────────
  const subscribeToRoom = useCallback((roomId) => {
    if (!supabase || !roomId || subscribedRef.current) return
    subscribedRef.current = true

    console.log('Subscribing to room:', roomId)

    // Écoute les changements de la row en DB (guest qui rejoint, questions dispo)
    const dbChannel = supabase
      .channel(`room-db-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        const updated = payload.new
        console.log('Room updated via Realtime:', {
          status: updated.status,
          guestId: updated.guest_id,
          hostId: updated.host_id,
          guestName: updated.guest_name,
          hostName: updated.host_name
        })
        setRoom(updated)

        // Définir opponentName selon si on est host ou guest
        if (userId === updated.host_id && updated.guest_id && updated.guest_name) {
          setOpponentName(updated.guest_name)
          setOpponentAvatar(updated.guest_avatar || null)
          setOpponentAvatarSeed(updated.guest_avatar_seed || null)
        } else if (userId === updated.guest_id && updated.host_name) {
          setOpponentName(updated.host_name)
          setOpponentAvatar(updated.host_avatar || null)
          setOpponentAvatarSeed(updated.host_avatar_seed || null)
        }

        if (updated.status === 'ready' || updated.status === 'playing') {
          setRoomStatus(updated.status)
        }
        if (updated.status === 'done' || updated.status === 'finished') {
          setRoomStatus('done')
        }
      })
      .subscribe((status) => {
        console.log('Realtime DB subscription status:', status)
      })

    // NOTE: Le canal broadcast pour les scores est géré par BattleQuiz.jsx
    // pour éviter les doubles souscriptions. useGameRoom gère uniquement la DB.

    // Stocker le channel DB pour cleanup
    channelRef._dbChannel = dbChannel
  }, [userId])

  // ── Cleanup des channels au unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (channelRef._dbChannel) {
        supabase?.removeChannel(channelRef._dbChannel)
      }
      subscribedRef.current = false
    }
  }, [])

  // ── Écrire les questions dans la room (appelé par le host) ───────────────
  const setRoomQuestions = useCallback(async (questions) => {
    if (!roomIdRef.current || !supabase) return
    const { data } = await supabase
      .from('game_rooms')
      .update({ questions, status: 'playing', started_at: new Date().toISOString() })
      .eq('id', roomIdRef.current)
      .select()
      .single()
    if (data) setRoom(data)
  }, [])

  // ── Marquer la room comme terminée ───────────────────────────────────────
  const finishRoom = useCallback(async () => {
    if (!roomIdRef.current || !supabase) return
    await supabase
      .from('game_rooms')
      .update({ status: 'done' })
      .eq('id', roomIdRef.current)
  }, [])

  // ── Annuler le matchmaking (quitter la room) ───────────────────────────────
  const cancelMatchmaking = useCallback(async () => {
    if (!roomIdRef.current || !supabase || !userId) return
    const roomId = roomIdRef.current
    
    // Supprimer la room si on est l'hôte en attente
    await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId)
      .eq('host_id', userId)
      .in('status', ['waiting', 'ready'])
    
    // Se retirer de la room si on est un guest
    await supabase
      .from('game_rooms')
      .update({ 
        guest_id: null, 
        guest_name: null, 
        guest_avatar: null,
        status: 'waiting'
      })
      .eq('id', roomId)
      .eq('guest_id', userId)
    
    // Nettoyer les channels
    if (channelRef._dbChannel) {
      supabase.removeChannel(channelRef._dbChannel)
    }
    
    // Reset l'état
    setRoom(null)
    setRoomStatus('idle')
    roomIdRef.current = null
  }, [userId])

  // ── Broadcast un score via Realtime ──────────────────────────────────────
  const broadcastScore = useCallback((score, correct) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'score',
      payload: { userId, userName, score, correct },
    })
  }, [userId, userName])

  // ── Quitter / nettoyer la room si on démonte ─────────────────────────────
  useEffect(() => {
    return () => {
      if (roomIdRef.current && supabase && userId) {
        const roomId = roomIdRef.current
        // Si on était host en attente OU en ready → supprimer la room
        // pour ne pas laisser de zombies
        supabase
          .from('game_rooms')
          .delete()
          .eq('id', roomId)
          .eq('host_id', userId)
          .in('status', ['waiting', 'ready'])
          .then(({ error }) => {
            if (error) console.log('Cleanup room (peut être normal):', error.message)
            else console.log('Cleanup: room supprimée:', roomId)
          })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return {
    room,
    roomStatus,     // idle | searching | waiting | ready | playing | done | error
    opponentName,
    opponentAvatar,
    opponentAvatarSeed,
    opponentScore,
    findOrCreate,
    setRoomQuestions,
    broadcastScore,
    finishRoom,
    cancelMatchmaking,
    isHost: room?.host_id === userId,
  }
}
