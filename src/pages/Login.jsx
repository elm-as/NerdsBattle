import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import Logo from '../components/ui/Logo.jsx'

export default function Login() {
  const { signIn, signUp, signInDiscord } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || '/'

  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let result
      if (mode === 'login') {
        result = await signIn(email, password)
      } else {
        if (!name.trim()) { setError('Ton prénom est requis.'); setLoading(false); return }
        result = await signUp(email, password, name.trim())
      }
      if (result.error) throw result.error
      navigate(nextPath, { replace: true })
    } catch (e) {
      setError(e.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscord = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await signInDiscord(nextPath)
      if (error) throw error
      // La redirection est gérée par Supabase OAuth
    } catch (e) {
      setError(e.message ?? 'Erreur connexion Discord')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <Logo size={56} className="mx-auto shadow-glow" />
          <h1 className="font-display text-3xl font-bold mt-3">NerdsBattle</h1>
          <p className="text-sm text-ink-mute dark:text-slate-400">
            {mode === 'login' ? 'Content de te revoir !' : 'Crée ton compte gratuitement'}
          </p>
        </div>

        <Card>
          <CardBody className="space-y-4">

            {/* Discord */}
            <Button variant="outline" className="w-full" onClick={handleDiscord} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Continuer avec Discord
            </Button>

            <div className="flex items-center gap-3 text-xs text-ink-mute dark:text-slate-500">
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              ou par email
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            </div>

            {/* Formulaire */}
            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                  <input
                    type="text"
                    placeholder="Ton prénom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-canvas-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-canvas-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-canvas-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
                <ArrowRight size={16} />
              </Button>
            </form>

          </CardBody>
        </Card>

        {/* Toggle login / register */}
        <p className="text-center text-sm text-ink-mute dark:text-slate-400">
          {mode === 'login' ? "Pas encore de compte ?" : 'Déjà inscrit ?'}{' '}
          <button
            className="font-semibold text-brand"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          >
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>

      </div>
    </div>
  )
}
