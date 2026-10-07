import { Play, Home, Trophy, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/play', label: 'Quiz', icon: Play },
  { to: '/leaderboards', label: 'Classement', icon: Trophy },
  { to: '/profile', label: 'Profil', icon: User }
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-4 inset-x-0 z-30 px-4">
      <nav
        className="max-w-sm mx-auto backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30"
        aria-label="Navigation principale"
      >
        <ul className="grid grid-cols-4 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 py-2 rounded-xl ${
                    isActive
                      ? 'text-brand bg-brand/10 dark:bg-brand/20'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative z-10">
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`relative z-10 text-[10px] font-bold tracking-wide ${isActive ? 'text-brand' : ''}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
