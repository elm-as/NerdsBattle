import { createClient } from '@supabase/supabase-js'

// Edge Function pour nettoyer les rooms (appelée par un cron)
Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Appeler la fonction de cleanup SQL
    const { data, error } = await supabase.rpc('cleanup_old_rooms')
    
    if (error) throw error

    // Rafraîchir les stats en cache
    await supabase.rpc('refresh_cached_stats')

    return new Response(
      JSON.stringify({
        success: true,
        deleted_rooms: data,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
