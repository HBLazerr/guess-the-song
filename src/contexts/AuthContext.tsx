import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, expiresIn: number) => void
  logout: () => void
  checkAuth: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Function to check if token is valid
  const checkAuth = (): boolean => {
    const token = localStorage.getItem('spotify_access_token')
    const tokenExpiry = localStorage.getItem('spotify_token_expiry')

    if (!token || !tokenExpiry) {
      return false
    }

    const now = Date.now()
    if (now >= parseInt(tokenExpiry)) {
      // Token expired - clean up
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_token_expiry')
      return false
    }

    return true
  }

  // Initialize auth state on mount
  useEffect(() => {
    const isValid = checkAuth()
    setIsAuthenticated(isValid)
    setIsLoading(false)
  }, [])

  // Set up interval to check token expiry every minute
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      const isValid = checkAuth()
      if (!isValid && isAuthenticated) {
        setIsAuthenticated(false)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const login = (token: string, expiresIn: number) => {
    localStorage.setItem('spotify_access_token', token)
    localStorage.setItem('spotify_token_expiry', (Date.now() + expiresIn * 1000).toString())
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_token_expiry')
    localStorage.removeItem('spotify_code_verifier')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
