import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'

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

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

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

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
