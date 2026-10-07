import { Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '../../context/UserContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../ui/Avatar.jsx'
import RankBadge from '../ui/RankBadge.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Logo from '../ui/Logo.jsx'

export default function TopBar() {
  const { user, streak, totalXp } = useUser()
  const { session, profile } = useAuth()
  const avatarUrl = profile?.avatar_url
    || session?.user?.user_metadata?.avatar_url
    || session?.user?.user_metadata?.picture
    || null
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas-light/80 dark:bg-canvas-dark/80 border-b border-black/5 dark:border-white/5">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-base group">
          <Logo size={32} className="group-hover:scale-105 transition-transform" />
          <span className="hidden sm:inline text-transparent bg-clip-text bg-gradient-to-r from-ink to-ink/70 dark:from-white dark:to-white/70 tracking-tight">
            NerdsBattle
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/profile"
            className="flex items-center gap-1 px-2 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500/15 transition-colors"
            aria-label="Streak"
          >
            <Flame size={14} />
            <span className="text-xs font-semibold tabular-nums">{streak?.count || 0}</span>
          </Link>
          <div className="hidden sm:block">
            <RankBadge xp={totalXp || 0} size="xs" showLabel={false} />
          </div>
          <Link to="/profile" aria-label="Mon profil">
            <Avatar name={user?.name || '?'} avatarUrl={avatarUrl} size="sm" />
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
