import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Radio, LogOut, Crown, ArrowLeft, Trophy, Target, Zap, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import StatsCard from '../ui/StatsCard'
import BrowseSelection, { type BrowseOption } from '../BrowseSelection'
import { useSpotify } from '@/hooks/useSpotify'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { logout } from '@/lib/spotify'
import { loadStats } from '@/lib/stats'
import type { GameMode, SpotifyArtist, SpotifyAlbum } from '@/types'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useSpotify()
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  // Track mode artist/album selection state
  const [showArtistSelect, setShowArtistSelect] = useState(false)
  const [showAlbumChoice, setShowAlbumChoice] = useState(false)
  const [showAlbumSelect, setShowAlbumSelect] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<BrowseOption | null>(null)

  // Fetch data for selection screens
  const { options: artistOptions } = useSpotifyData('artist')
  const { options: albumOptions } = useSpotifyData('genre', {
    artistId: selectedArtist?.id,
    fetchAlbums: true,
  })

  // Check Premium status on mount
  useEffect(() => {
    if (user?.isPremium !== undefined) {
      setIsPremium(user.isPremium)

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
      id: 'genre' as GameMode,
      title: 'Track Mode',
      description: 'Name that tune from your favorites',
      icon: Radio,
      recommended: true,
    },
  ]

  const handleStartGame = () => {
    if (!selectedMode) return

    // For Track Mode, show artist selection first
    if (selectedMode === 'genre') {
      setShowArtistSelect(true)
      return
    }

    // For other modes, go straight to game
    navigate('/game', { state: { mode: selectedMode } })
  }

  const handleArtistSelected = (artistName: string) => {
    const artist = artistOptions.find((a) => a.name === artistName)
    if (artist) {
      setSelectedArtist(artist)
      setShowArtistSelect(false)
      setShowAlbumChoice(true)
    }
  }

  const handlePlayAllAlbums = () => {
    if (selectedArtist) {
      navigate('/game', {
        state: {
          mode: 'genre',
          artist: { id: selectedArtist.id, name: selectedArtist.name } as SpotifyArtist,
        },
      })
    }
  }

  const handleChooseAlbum = () => {
    setShowAlbumChoice(false)
    setShowAlbumSelect(true)
  }

  const handleAlbumSelected = (albumName: string) => {
    const album = albumOptions.find((a) => a.name === albumName)
    if (album && selectedArtist) {
      navigate('/game', {
        state: {
          mode: 'genre',
          artist: { id: selectedArtist.id, name: selectedArtist.name } as SpotifyArtist,
          album: { id: album.id, name: album.name } as SpotifyAlbum,
        },
      })
    }
  }

  const handleBackToModes = () => {
    setShowArtistSelect(false)
    setShowAlbumChoice(false)
    setShowAlbumSelect(false)
    setSelectedArtist(null)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <Container className="max-w-4xl">
        <AnimatePresence mode="wait">
          {showArtistSelect ? (
            /* Artist Selection Screen */
            <motion.div
              key="artist-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-md">
                <Button variant="ghost" size="sm" onClick={handleBackToModes}>
                  <ArrowLeft className="w-4 h-4 mr-sm" />
                  Back to Modes
                </Button>
              </div>
              <h2 className="text-2xl font-bold mb-md text-center">Select an Artist</h2>
              <p className="text-white/70 text-center mb-xl">Choose which artist to test your knowledge on</p>
              <BrowseSelection
                options={artistOptions}
                mode="artist"
                onSelect={handleArtistSelected}
              />
            </motion.div>
          ) : showAlbumChoice ? (
            /* Album Choice Screen */
            <motion.div
              key="album-choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-md">
                <Button variant="ghost" size="sm" onClick={() => { setShowAlbumChoice(false); setShowArtistSelect(true); }}>
                  <ArrowLeft className="w-4 h-4 mr-sm" />
                  Back to Artists
                </Button>
              </div>
              <h2 className="text-2xl font-bold mb-md text-center">Play with All Albums or Choose One?</h2>
              <p className="text-white/70 text-center mb-xl">
                Selected Artist: <span className="text-primary font-semibold">{selectedArtist?.name}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto">
                <Card variant="glass" className="cursor-pointer hover:bg-white/10 transition-all" onClick={handlePlayAllAlbums}>
                  <div className="text-center p-lg">
                    <Music className="w-16 h-16 mx-auto mb-md text-primary" />
                    <h3 className="text-lg font-semibold mb-sm">All Albums</h3>
                    <p className="text-sm text-white/70">Test your knowledge across all albums by this artist (harder)</p>
                  </div>
                </Card>
                <Card variant="glass" className="cursor-pointer hover:bg-white/10 transition-all" onClick={handleChooseAlbum}>
                  <div className="text-center p-lg">
                    <Music className="w-16 h-16 mx-auto mb-md text-primary" />
                    <h3 className="text-lg font-semibold mb-sm">Specific Album</h3>
                    <p className="text-sm text-white/70">Choose a specific album to focus on (easier)</p>
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : showAlbumSelect ? (
            /* Album Selection Screen */
            <motion.div
              key="album-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-md">
                <Button variant="ghost" size="sm" onClick={() => { setShowAlbumSelect(false); setShowAlbumChoice(true); }}>
                  <ArrowLeft className="w-4 h-4 mr-sm" />
                  Back
                </Button>
              </div>
              <h2 className="text-2xl font-bold mb-md text-center">Select an Album</h2>
              <p className="text-white/70 text-center mb-xl">
                by <span className="text-primary font-semibold">{selectedArtist?.name}</span>
              </p>
              <BrowseSelection
                options={albumOptions}
                mode="album"
                onSelect={handleAlbumSelected}
              />
            </motion.div>
          ) : (
            /* Main Mode Selection Screen */
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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

              {/* Stats Dashboard */}
              {(() => {
                const stats = loadStats()

                if (stats.totalGames > 0) {
                  return (
                    <div className="mb-xl">
                      <h2 className="text-lg font-semibold mb-md flex items-center gap-sm">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Your Stats
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                        <StatsCard
                          icon={Trophy}
                          label="Total Games"
                          value={stats.totalGames}
                          iconColor="text-yellow-400"
                          delay={0.1}
                        />
                        <StatsCard
                          icon={Target}
                          label="All-Time Best"
                          value={`${stats.bestScore}%`}
                          subtitle={`${Math.round(stats.averageAccuracy)}% average`}
                          iconColor="text-primary"
                          delay={0.15}
                        />
                        <StatsCard
                          icon={Zap}
                          label="Current Streak"
                          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`}
                          subtitle={`${stats.maxStreak} day max`}
                          iconColor="text-purple-400"
                          delay={0.2}
                        />
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-xl"
                    >
                      <Card variant="glass">
                        <div className="text-center py-lg">
                          <Sparkles className="w-12 h-12 mx-auto mb-md text-primary" />
                          <h3 className="text-lg font-semibold mb-sm">Ready to Start?</h3>
                          <p className="text-sm text-white/70">
                            Play your first game to start tracking your stats!
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  )
                }
              })()}

              {/* Mode Selection */}
              <div className="max-w-md mx-auto mb-xl">
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
                          {mode.recommended && (
                            <div className="mb-sm">
                              <span className="inline-flex items-center gap-xs bg-primary/20 px-sm py-xs rounded-full text-xs font-semibold text-primary">
                                ⭐ Recommended
                              </span>
                            </div>
                          )}
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
      )}
      </AnimatePresence>
      </Container>
    </div>
  )
}
