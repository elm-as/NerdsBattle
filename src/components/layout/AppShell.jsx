import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import TopBar from './TopBar.jsx'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink dark:text-slate-100 font-sans">
      <TopBar />
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-3">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
