import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginScreen from './components/screens/LoginScreen'
import HomeScreen from './components/screens/HomeScreen'
import GameScreen from './components/screens/GameScreen'
import ResultScreen from './components/screens/ResultScreen'

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
          path="/game"
          element={isAuthenticated ? <GameScreen /> : <Navigate to="/login" />}
        />
        <Route
          path="/results"
          element={isAuthenticated ? <ResultScreen /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  )
}

export default App
