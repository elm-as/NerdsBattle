import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [profile, setProfile]   = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!supabase) { setSession(null); return }

    // Gérer le callback OAuth (hash dans l'URL après connexion Discord)
    const handleAuthCallback = async () => {
      const { data: { session: newSession }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Erreur récupération session:', error)
      }
      setSession(newSession ?? null)
    }

    handleAuthCallback()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('Auth event:', event)
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Charger le profil Supabase quand session change, créer si inexistant
  useEffect(() => {
    console.log('AuthContext effect:', { hasSupabase: !!supabase, hasSession: !!session?.user })
    
    if (!supabase) { setLoadingProfile(false); return }
    if (!session?.user) { setProfile(null); setLoadingProfile(false); return }
    
    const loadOrCreateProfile = async () => {
      setLoadingProfile(true)
      console.log('Chargement profil pour:', session.user.id)
      
      // Essayer de récupérer le profil
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
      
      console.log('Résultat requête profil:', { profilesCount: profiles?.length, error: fetchError?.message })
      
      // Si on a un profil existant
      if (profiles && profiles.length > 0) {
        console.log('Profil trouvé:', profiles[0])
        setProfile(profiles[0])
        setLoadingProfile(false)
        return
      }
      
      // Si erreur autre que "pas de résultat", loguer
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erreur chargement profil:', fetchError)
      }
      
      // Profil inexistant - ne pas créer automatiquement, laisser l'onboarding le faire
      console.log('Profil non trouvé, redirection onboarding nécessaire')
      setProfile(null)
      setLoadingProfile(false)
    }
    
    loadOrCreateProfile()
  }, [session?.user?.id])

  const signUp = async (email, password, name) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    // Si l'inscription réussit mais que le profil n'est pas créé (trigger échoué),
    // créer le profil manuellement
    if (result.data?.user && !result.error) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: result.data.user.id,
          name: name || 'Anonyme'
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Erreur création profil:', profileError)
      }
    }

    return result
  }

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signInDiscord = async (nextPath = '/') => {
    const target = nextPath && nextPath !== '/' ? nextPath : '/'
    const redirectTo = new URL(`${window.location.origin}${target.startsWith('/') ? target : '/' + target}`)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectTo.toString(),
        skipBrowserRedirect: false
      }
    })
    return { data, error }
  }

  const signOut = () => supabase.auth.signOut()

  const updateProfile = async (patch) => {
    if (!session?.user) return
    const { data } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', session.user.id)
      .select()
      .single()
    if (data) setProfile(data)
    return data
  }

  // Combinaison des deux loadings
  const loading = session === undefined || loadingProfile

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, updateProfile, signUp, signIn, signInDiscord, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
