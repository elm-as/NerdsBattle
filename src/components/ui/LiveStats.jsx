import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { Users, Gamepad2, UserCheck } from 'lucide-react'

export default function LiveStats() {
  const [stats, setStats] = useState({
    users_online: 1,
    active_games: 0,
    total_users: 3,
    waiting_rooms: 0
  })
  const [onlineCount, setOnlineCount] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return

    // 1. Suivi de présence temps réel (Supabase Realtime Presence)
    const channel = supabase.channel('nb-online-players', {
      config: { presence: { key: 'client' } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setOnlineCount(Math.max(1, count))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: Date.now() })
        }
      })

    // 2. Récupération des stats de la base
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('cached_stats')
          .select('*')
          .single()

        if (!error && data) {
          setStats(data)
        } else {
          const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
          
          setStats((prev) => ({
            ...prev,
            total_users: Math.max(totalUsers || 0, 3)
          }))
        }
      } catch (err) {
        console.error('Erreur stats:', err)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  const items = [
    { 
      icon: Users, 
      value: Math.max(1, onlineCount || stats.users_online || 1), 
      label: 'en ligne', 
      color: 'text-emerald-500' 
    },
    { 
      icon: Gamepad2, 
      value: stats.active_games ?? 0, 
      label: 'parties', 
      color: 'text-amber-500' 
    },
    { 
      icon: UserCheck, 
      value: Math.max(1, stats.total_users || 3), 
      label: 'inscrits', 
      color: 'text-brand' 
    }
  ]

  return (
    <div className="flex items-center justify-center gap-3 py-1.5 opacity-60 hover:opacity-100 transition-opacity">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <item.icon size={11} className={`${item.color}`} />
          <span className="text-[10px] text-ink-mute">
            <span className="font-semibold text-ink">{item.value}</span> {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
