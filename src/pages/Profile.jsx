import { Award, ChevronRight, Globe2, LogOut, Sparkles, Flame, Lock, Trophy, Zap, TrendingUp, Eye } from 'lucide-react'
import Flag from '../components/ui/Flag.jsx'
import { useState } from 'react'
import { Card, CardBody } from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import RankBadge from '../components/ui/RankBadge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import RanksModal from '../components/ui/RanksModal.jsx'
import EloRanksModal from '../components/ui/EloRanksModal.jsx'
import { useUser } from '../context/UserContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getLevel } from '../data/levels.js'
import { getCountry } from '../data/countries.js'
import { getRankProgress } from '../data/ranks.js'
import { computeBadges, RARITY_STYLES } from '../data/badges.js'
import { RANK_THRESHOLDS, getRankByElo, getEloProgress } from '../lib/eloSystem.js'

export default function Profile() {
  const { user, totalXp, streak, history, reset } = useUser()
  const { session, profile, signOut } = useAuth()
  const [showRanks, setShowRanks] = useState(false)
  const [showEloRanks, setShowEloRanks] = useState(false)
  const [showLocked, setShowLocked] = useState(false)
  if (!user) return null

  const avatarUrl = profile?.avatar_url
    || session?.user?.user_metadata?.avatar_url
    || session?.user?.user_metadata?.picture
    || null
  const canUpload = !!session?.user

  const level = getLevel(user.levelId)
  const country = getCountry(user.country)
  const elo = user?.elo || 400
  const eloRank = user?.eloRank || 'bronze'
  const currentEloRank = getRankByElo(elo)
  const eloProgress = getEloProgress(elo)
  const wins = user?.wins || 0
  const losses = user?.losses || 0
  const totalGames = wins + losses
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  const { unlocked: badges, locked: lockedBadges } = computeBadges({ totalXp: totalXp || 0, streak, history })

  return (
    <div className="space-y-5">
      {showRanks && <RanksModal xp={totalXp || 0} onClose={() => setShowRanks(false)} />}
      {showEloRanks && <EloRanksModal elo={elo} eloRank={eloRank} onClose={() => setShowEloRanks(false)} />}

      {/* Identité */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <Avatar name={user.name} avatarUrl={avatarUrl} size="lg" editable={canUpload} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{user.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge tone="brand">
                <Flag code={user.country} size="sm" /> {country?.name}
              </Badge>
              <Badge tone="slate">
                {level?.name}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rang Compétitif (ELO) */}
      <Card className="overflow-hidden border-2 border-brand/20">
        <CardBody className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${currentEloRank.color} grid place-items-center text-white shadow-lg`}>
              <Trophy size={28} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-mute">Rang Compétitif</div>
              <div className="font-display text-xl font-bold truncate">{currentEloRank.name}</div>
              <div className="text-xs text-ink-mute">{wins}V - {losses}D ({winRate}% WR)</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-mute">Elo</div>
              <div className="font-display text-2xl font-bold text-brand">{elo}</div>
            </div>
          </div>

          {/* Barre progression vers rang suivant */}
          {eloProgress < 100 && (
            <div>
              <div className="flex justify-between text-[11px] text-ink-mute mb-1">
                <span>Prochain rang</span>
                <span>{eloProgress.toFixed(0)}%</span>
              </div>
              <div className={`h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
                <div className={`h-full bg-gradient-to-r ${currentEloRank.color} rounded-full`} style={{ width: `${eloProgress}%` }} />
              </div>
            </div>
          )}

          <button
            onClick={() => setShowEloRanks(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-ink-mute hover:text-brand transition-colors"
          >
            <Eye size={14} /> Voir tous les rangs <ChevronRight size={14} />
          </button>
        </CardBody>
      </Card>

      {/* Rang XP */}
      <RankCard xp={totalXp || 0} onShowRanks={() => setShowRanks(true)} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Trophy size={16} />} label="Elo" value={elo} color="text-amber-500" />
        <Stat icon={<Sparkles size={16} />} label="XP" value={totalXp || 0} color="text-brand" />
        <Stat icon={<Flame size={16} />} label="Streak" value={streak?.count || 0} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Zap size={16} />} label="Victoires" value={wins} color="text-emerald-500" />
        <Stat icon={<TrendingUp size={16} />} label="Défaites" value={losses} color="text-rose-500" />
      </div>

      {/* Badges */}
      <section>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Award size={18} /> Badges
          <span className="text-xs font-normal text-ink-mute dark:text-slate-400 ml-auto">
            {badges.length}/{badges.length + lockedBadges.length} débloqués
          </span>
        </h2>
        {badges.length === 0 && (
          <p className="text-sm text-ink-mute dark:text-slate-400 mb-3">Joue quelques quiz pour débloquer tes premiers badges.</p>
        )}
        {badges.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {badges.map((b) => {
              const Icon = b.icon
              const rarity = RARITY_STYLES[b.rarity]
              return (
                <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-canvas-surface border border-black/5 dark:border-white/5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 dark:bg-brand-dark/15 grid place-items-center">
                    <Icon size={18} className="text-brand dark:text-brand-dark" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-xs truncate">{b.label}</div>
                    <div className={`text-[10px] font-medium ${rarity.color}`}>{rarity.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <button onClick={() => setShowLocked((v) => !v)} className="text-xs text-ink-mute dark:text-slate-400 flex items-center gap-1 hover:text-ink dark:hover:text-slate-200 transition-colors">
          <Lock size={12} /> {showLocked ? 'Masquer' : `Voir ${lockedBadges.length} badges verrouillés`}
        </button>
        {showLocked && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {lockedBadges.map((b) => {
              const Icon = b.icon
              return (
                <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 opacity-50">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-black/5 dark:bg-white/5 grid place-items-center">
                    <Icon size={18} className="text-ink-mute" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-xs truncate text-ink-mute">{b.label}</div>
                    <div className="text-[10px] text-ink-mute/60 truncate">{b.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      {signOut && (
        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          <LogOut size={16} /> Se déconnecter
        </Button>
      )}
      <Button variant="ghost" className="w-full text-rose-500" onClick={() => { if (confirm('Réinitialiser ton profil et toutes tes statistiques ?')) reset() }}>
        Réinitialiser le profil
      </Button>

      <Credits />
    </div>
  )
}

function RankCard({ xp, onShowRanks }) {
  const { current, next, ratio, xpInLevel, xpNeeded } = getRankProgress(xp)
  const Icon = current.icon
  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-3">
        <div className="flex items-center gap-3">
          <span className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${current.color} grid place-items-center text-white ring-2 ${current.ring} shadow-glow`}>
            <Icon size={28} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-mute">Rang XP</div>
            <div className="font-display text-xl font-bold truncate">{current.name}</div>
            <div className="text-xs text-ink-mute dark:text-slate-400 capitalize">{current.tier}</div>
          </div>
          {next && (
            <button onClick={onShowRanks} className="text-right hover:opacity-70 transition-opacity">
              <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-mute">Suivant</div>
              <div className="flex items-center gap-1 font-display font-semibold text-sm">{next.name} <ChevronRight size={14} className="text-ink-mute" /></div>
            </button>
          )}
        </div>
        {next ? (
          <div>
            <ProgressBar value={Math.round(ratio * 100)} max={100} />
            <div className="flex justify-between text-[11px] text-ink-mute dark:text-slate-400 mt-1.5 font-mono">
              <span>{xpInLevel} XP</span>
              <span>{xpNeeded} XP restant</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-center text-amber-600 dark:text-amber-300 font-display font-bold uppercase tracking-wider">Rang maximum atteint</p>
        )}
      </CardBody>
    </Card>
  )
}

function Stat({ icon, label, value, color = 'text-ink' }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-canvas-surface border border-black/5 dark:border-white/5 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">{icon}{label}</div>
      <div className={`font-display text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

function Credits() {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/5 p-4 text-center space-y-2">
      <p className="text-[11px] font-display font-bold uppercase tracking-wider text-ink-mute dark:text-slate-500">À propos</p>
      <p className="text-sm font-display font-semibold">NerdsBattle</p>
      <p className="text-xs text-ink-mute dark:text-slate-400">
        Conçu &amp; développé par <span className="font-semibold text-ink dark:text-slate-200">Elmas</span>
      </p>
      <div className="pt-2 space-y-1 border-t border-black/5 dark:border-white/5">
        <p className="text-[10px] text-ink-mute/70 dark:text-slate-500 uppercase tracking-wider font-semibold">Propulsé par</p>
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-ink-mute dark:text-slate-400">
            <Sparkles size={12} className="text-blue-500" /> <span className="font-semibold text-ink dark:text-slate-200">LWS</span> <span className="text-[10px]"></span>
          </span>
          <span className="text-ink-mute/30">•</span>
          <span className="flex items-center gap-1 text-ink-mute dark:text-slate-400">
            <Zap size={12} className="text-emerald-500" /> <span className="font-semibold text-ink dark:text-slate-200">Supabase</span> <span className="text-[10px]"></span>
          </span>
        </div>
        <p className="text-[9px] text-ink-mute/50 dark:text-slate-600 font-medium">100% gratuit</p>
      </div>
      <p className="text-[10px] text-ink-mute/60 dark:text-slate-600 pt-1 tabular-nums">v0.2.0</p>
    </div>
  )
}
