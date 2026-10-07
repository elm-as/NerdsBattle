import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import Router from './router.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
