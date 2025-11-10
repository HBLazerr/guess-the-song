import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music, User, Disc, Radio, LogOut, Crown } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import { useSpotify } from '@/hooks/useSpotify'
import { logout } from '@/lib/spotify'
import type { GameMode } from '@/types'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useSpotify()
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [premiumChecked, setPremiumChecked] = useState(false)

  // Check Premium status on mount
  useEffect(() => {
    if (user?.isPremium !== undefined) {
      setIsPremium(user.isPremium)
      setPremiumChecked(true)

      // Show alert for non-Premium users
      if (!user.isPremium) {
        alert(
          'Spotify Premium Required\n\n' +
          'This game requires a Spotify Premium account to play music.\n\n' +
          'Please upgrade to Premium and sign in again.'
        )
      }
    }
  }, [user])

  const modes = [
    {
      id: 'artist' as GameMode,
      title: 'Artist Mode',
      description: 'Guess the artist from your top tracks',
      icon: User,
    },
    {
      id: 'album' as GameMode,
      title: 'Album Mode',
      description: 'Identify albums from your library',
      icon: Disc,
    },
    {
      id: 'genre' as GameMode,
      title: 'Track Mode',
      description: 'Name that tune from your favorites',
      icon: Radio,
    },
  ]

  const handleStartGame = () => {
    if (selectedMode) {
      navigate('/game', { state: { mode: selectedMode } })
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <Container className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-2xl">
            <div className="flex items-center justify-between mb-xl">
              <div className="flex items-center gap-md">
                <Music className="w-8 h-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">LZRS Player</h1>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-sm mb-lg"
              >
                <div className="flex items-center gap-md">
                  {user.profile_img && (
                    <img
                      src={user.profile_img}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-white/70 text-sm">Welcome back,</p>
                    <p className="text-lg font-semibold">{user.name}</p>
                  </div>
                </div>
                {isPremium && (
                  <div className="flex items-center gap-xs bg-primary/20 px-md py-xs rounded-full">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-semibold">Premium</span>
                  </div>
                )}
              </motion.div>
            )}

            <p className="text-white/70 text-base md:text-md">
              Choose a game mode to test your music knowledge
            </p>
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            {modes.map((mode, index) => {
              const Icon = mode.icon
              const isSelected = selectedMode === mode.id

              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card
                    variant="glass"
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/10'
                        : 'hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-md ${
                          isSelected ? 'bg-primary text-background' : 'bg-white/10 text-primary'
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold mb-sm">{mode.title}</h3>
                      <p className="text-sm text-white/70">{mode.description}</p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={handleStartGame}
              disabled={!selectedMode || !isPremium}
              className="w-full max-w-md mx-auto block"
            >
              {isPremium === false ? 'Premium Required' : 'Start Game'}
            </Button>
            {isPremium === false && (
              <p className="text-center text-sm text-white/50 mt-md">
                Upgrade to Spotify Premium to play
              </p>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}
