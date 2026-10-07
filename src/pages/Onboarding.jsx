import { ArrowRight, Check, GraduationCap, Globe2 } from 'lucide-react'
import Logo from '../components/ui/Logo.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardBody } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { SUBJECTS } from '../data/subjects.js'
import { CYCLES, getLevelsByCycle } from '../data/levels.js'
import { COUNTRIES, getFlag } from '../data/countries.js'
import { useUser } from '../context/UserContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import ThemeToggle from '../components/layout/ThemeToggle.jsx'

export default function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || '/'
  const { completeOnboarding, updateUser, user } = useUser()
  const { session, setProfile, profile } = useAuth()

  // Si le joueur est déjà onboardé (a déjà un niveau configuré), rediriger immédiatement
  useEffect(() => {
    if (user?.levelId || profile?.level_id) {
      console.log('[Onboarding] Joueur déjà configuré, redirection immédiate vers:', nextPath)
      navigate(nextPath, { replace: true })
    }
  }, [user?.levelId, profile?.level_id, nextPath, navigate])

  // Pré-remplir depuis les metadata OAuth (Discord, Google...)
  const oauthName = session?.user?.user_metadata?.full_name
    || session?.user?.user_metadata?.name
    || ''

  const [step, setStep] = useState(0)
  const [name, setName] = useState(oauthName)
  const [levelId, setLevelId] = useState(null)
  const [country, setCountry] = useState('FR')
  const [subjects, setSubjects] = useState([])

  const canNext = useMemo(() => {
    if (step === 0) return name.trim().length >= 2 || oauthName.length >= 2
    if (step === 1) return !!levelId
    if (step === 2) return subjects.length >= 1
    return true
  }, [step, name, levelId, subjects])

  const avatarUrl = session?.user?.user_metadata?.avatar_url
    || session?.user?.user_metadata?.picture
    || null

  const finish = async () => {
    const finalName = name.trim() || oauthName
    console.log('Onboarding finish:', { userId: session?.user?.id, levelId, country, subjects })

    // Synchroniser avec Supabase si connecté
    if (session?.user) {
      const seed = Math.random().toString(36).slice(2, 8)
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: finalName,
          level_id: levelId,
          country: country,
          subjects: subjects,
          avatar_seed: seed,
          avatar_url: avatarUrl
        }, { onConflict: 'id' })
        .select()

      if (error) {
        console.error('Erreur sauvegarde profil:', error)
      } else {
        console.log('Profil sauvegardé:', data)
        if (data?.[0]) {
          setProfile(data[0])
        }
      }
    }

    const userData = {
      id: session?.user?.id,
      name: finalName,
      levelId,
      country,
      subjects,
      avatarSeed: Math.random().toString(36).slice(2, 8),
      avatarUrl
    }

    completeOnboarding(userData)
    updateUser(userData)
    navigate(nextPath, { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink dark:text-slate-100 px-4 pb-10">
      <div className="max-w-md mx-auto pt-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <Logo size={36} />
            NerdsBattle
          </div>
          <ThemeToggle />
        </div>

        <div className="flex gap-2 mb-8" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand' : 'bg-black/10 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="space-y-6 animate-slideUp">
            <header>
              <h1 className="font-display text-3xl font-bold leading-tight">
                Bienvenue, futur champion.
              </h1>
              <p className="text-ink-mute dark:text-slate-400 mt-2">
                Quelques questions rapides pour personnaliser ton entraînement.
              </p>
            </header>
            {avatarUrl && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover" />
                <div>
                  <div className="text-xs text-ink-mute dark:text-slate-400">Connecté via Discord</div>
                  <div className="font-display font-bold">{oauthName}</div>
                </div>
              </div>
            )}
            <label className="block">
              <span className="text-sm font-semibold">Ton pseudo dans NerdsBattle</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={oauthName || 'ex : NeoNerd'}
                className="mt-2 w-full h-14 px-5 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-transparent font-display text-lg focus:outline-none focus:border-brand"
              />
            </label>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6 animate-slideUp">
            <header>
              <h1 className="font-display text-3xl font-bold flex items-center gap-2">
                <GraduationCap className="text-brand" /> Ton niveau
              </h1>
              <p className="text-ink-mute dark:text-slate-400 mt-2">
                Tu ne concourras qu'avec des élèves du même niveau.
              </p>
            </header>
            <div className="space-y-5">
              {CYCLES.map((cycle) => {
                const levels = getLevelsByCycle(cycle.id)
                if (levels.length === 0) return null
                return (
                  <div key={cycle.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${cycle.color}`}
                        aria-hidden="true"
                      />
                      <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink-mute">
                        {cycle.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {levels.map((l) => {
                        const active = levelId === l.id
                        return (
                          <button
                            key={l.id}
                            onClick={() => setLevelId(l.id)}
                            className={`h-16 rounded-2xl border-2 font-display font-semibold transition-all ${
                              active
                                ? 'border-brand bg-brand/10 dark:bg-brand-dark/15'
                                : 'border-black/10 dark:border-white/10 hover:border-brand/40'
                            }`}
                          >
                            <div className="text-base leading-tight">{l.short}</div>
                            <div className="text-[10px] text-ink-mute dark:text-slate-400 leading-tight">
                              {l.name}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <label className="block">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Globe2 size={14} /> Pays
              </span>
              <div className="mt-2 relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-12 px-4 pl-12 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-transparent font-display appearance-none cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-canvas-surface">
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                {/* Drapeau affiché à gauche */}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                  {getFlag(country)}
                </span>
                {/* Flèche dropdown */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-mute">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6 animate-slideUp">
            <header>
              <h1 className="font-display text-3xl font-bold">Tes matières préférées</h1>
              <p className="text-ink-mute dark:text-slate-400 mt-2">
                On commencera par celles-là. Sélectionnes-en au moins une.
              </p>
            </header>
            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((s) => {
                const active = subjects.includes(s.id)
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      setSubjects((prev) =>
                        active ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                      )
                    }
                    className={`relative h-28 rounded-2xl border-2 p-4 text-left transition-all ${
                      active
                        ? 'border-brand bg-brand/10 dark:bg-brand-dark/15'
                        : 'border-black/10 dark:border-white/10 hover:border-brand/40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center text-white mb-2`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="font-display font-semibold text-sm">{s.name}</div>
                    {active && (
                      <Check
                        size={18}
                        className="absolute top-3 right-3 text-brand"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Retour
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continuer <ArrowRight size={18} />
            </Button>
          ) : (
            <Button onClick={() => finish()} disabled={!canNext}>
              C'est parti <ArrowRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
