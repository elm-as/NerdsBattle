import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import { useUser } from './context/UserContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { supabase } from './lib/supabase.js'
import CourseDetail from './pages/CourseDetail.jsx'
import Home from './pages/Home.jsx'
import Leaderboards from './pages/Leaderboards.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Play from './pages/Play.jsx'
import Profile from './pages/Profile.jsx'
import Matchmaking from './pages/Matchmaking.jsx'
import Quiz from './pages/Quiz.jsx'
import BattleQuiz from './pages/BattleQuiz.jsx'
import Results from './pages/Results.jsx'

export default function Router() {
  const location = useLocation()
  const { user, loading: userLoading } = useUser()
  const { session, loading: authLoading, profile } = useAuth()
  // Vérifier à la fois le localStorage (UserContext) et le profil Supabase
  const onboarded = !!(user?.levelId || profile?.level_id)
  
  // Combiner les deux loadings
  const loading = authLoading || userLoading

  // DEBUG logs - afficher les valeurs exactes
  console.log('Router debug:', JSON.stringify({ 
    authLoading,
    userLoading,
    loading, 
    hasSession: !!session, 
    userLevelId: user?.levelId, 
    profileLevelId: profile?.level_id,
    profileExists: !!profile,
    userExists: !!user?.id,
    userId: user?.id,
    onboarded 
  }, null, 2))

  // Si Supabase est configuré et que l'authentification ou le profil est en cours de chargement → spinner
  const isLoading = loading
  
  if (supabase && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  // Si Supabase est configuré et l'user n'est pas connecté → Login
  const needsAuth = supabase && !session
  
  // Log pour debug
  console.log('Router decision:', { needsAuth, isLoading, onboarded, hasProfile: !!profile })

  // Capture de l'URL demandée pour rediriger après connexion
  const currentPath = location.pathname !== '/login' && location.pathname !== '/onboarding' 
    ? encodeURIComponent(location.pathname + location.search)
    : ''
  
  // Récupérer le paramètre next éventuel
  const nextParam = new URLSearchParams(location.search).get('next')
  const targetPath = nextParam ? decodeURIComponent(nextParam) : '/'

  const loginUrl = currentPath ? `/login?next=${currentPath}` : '/login'
  const onboardingUrl = currentPath ? `/onboarding?next=${currentPath}` : '/onboarding'

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to={targetPath} replace /> : <Login />}
      />
      <Route
        path="/onboarding"
        element={onboarded ? <Navigate to={targetPath} replace /> : <Onboarding />}
      />
      {needsAuth ? (
        <Route path="*" element={<Navigate to={loginUrl} replace />} />
      ) : !onboarded ? (
        <Route path="*" element={<Navigate to={onboardingUrl} replace />} />
      ) : (
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/explore" element={<Navigate to="/play" replace />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/quiz/:courseId" element={<Quiz />} />
          <Route path="/battle" element={<BattleQuiz />} />
          <Route path="/results/:courseId" element={<Results />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  )
}
