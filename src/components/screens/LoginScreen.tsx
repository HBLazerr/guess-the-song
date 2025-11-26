import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import LiquidEther from '../LiquidEther'
import { redirectToSpotifyAuth, handleSpotifyCallback, clearAuthData } from '@/lib/spotify'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const processingRef = useRef(false)
  const { login } = useAuth()

  useEffect(() => {
    // Handle OAuth callback
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('Spotify authorization error:', error)
      // Clear any existing auth data to prevent continuing with stale tokens
      clearAuthData()
      alert(`Authorization failed: ${error}`)
      navigate('/login', { replace: true })
      return
    }

    // Prevent double execution (React StrictMode runs effects twice in dev)
    if (code && !processingRef.current) {
      processingRef.current = true
      console.log('Processing Spotify callback...')

      handleSpotifyCallback(code)
        .then(({ accessToken, expiresIn }) => {
          console.log('Authentication successful!')
          login(accessToken, expiresIn)
          navigate('/', { replace: true })
        })
        .catch((error) => {
          console.error('Failed to authenticate:', error)
          // Clear any existing auth data to prevent continuing with stale tokens
          clearAuthData()
          alert(`Authentication failed: ${error.message}`)
          processingRef.current = false // Reset on error so user can retry
          navigate('/login', { replace: true })
        })
    }
  }, [searchParams, navigate, login])

  const handleLogin = () => {
    redirectToSpotifyAuth()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg relative">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-40">
        <LiquidEther
          colors={['#1DB954', '#1ed760', '#169c46']}
          mouseForce={25}
          cursorSize={120}
          autoDemo={true}
          autoSpeed={0.3}
          autoIntensity={1.8}
        />
      </div>

      {/* Content */}
      <Container className="max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            className="mb-2xl"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full glass-morphic mb-lg">
              <Music className="w-12 h-12 text-primary" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            LZRS Player
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-md md:text-lg text-white/70 mb-2xl max-w-lg mx-auto leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Test your music knowledge with tracks from your favorite artists, albums, and genres.
            <br />
            Powered by Spotify.
          </motion.p>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={handleLogin}
              className="w-full max-w-sm mx-auto flex items-center gap-md"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Sign in with Spotify
            </Button>
          </motion.div>

          {/* Info Text */}
          <motion.p
            className="text-xs text-white/50 mt-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            You'll need a Spotify account to play
          </motion.p>
        </motion.div>
      </Container>
    </div>
  )
}
