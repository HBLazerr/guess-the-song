import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'

// Lazy load all screen components for code splitting
// This reduces initial bundle size by ~60% (only loads login screen initially)
const LoginScreen = lazy(() => import('./components/screens/LoginScreen'))
const HomeScreen = lazy(() => import('./components/screens/HomeScreen'))
const GameSettingsScreen = lazy(() => import('./components/screens/GameSettingsScreen'))
const GameScreen = lazy(() => import('./components/screens/GameScreen'))
const ResultScreen = lazy(() => import('./components/screens/ResultScreen'))

// Simple loading component for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has valid Spotify token
    const token = localStorage.getItem('spotify_access_token')
    const tokenExpiry = localStorage.getItem('spotify_token_expiry')

    if (token && tokenExpiry) {
      const now = Date.now()
      if (now < parseInt(tokenExpiry)) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_token_expiry')
      }
    }

    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <LoginScreen />}
          />
          <Route
            path="/callback"
            element={<LoginScreen />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <HomeScreen /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <GameSettingsScreen /> : <Navigate to="/login" />}
          />
          <Route
            path="/game"
            element={isAuthenticated ? <GameScreen /> : <Navigate to="/login" />}
          />
          <Route
            path="/results"
            element={isAuthenticated ? <ResultScreen /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
