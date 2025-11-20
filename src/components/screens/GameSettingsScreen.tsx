import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Music, Clock, Pause } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import {
  DEFAULT_SETTINGS,
  getAvailableRoundOptions,
  getDefaultRoundSetting,
  loadLastSettings,
  saveLastSettings,
  type RoundOption,
} from '@/lib/gameSettings'
import { useSpotify } from '@/hooks/useSpotify'
import type { GameSettings, TimeSetting, RoundSetting, SpotifyArtist, SpotifyAlbum } from '@/types'

export default function GameSettingsScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getTracksForMode } = useSpotify()

  // Extract artist/album from navigation state
  const { artist, album } = location.state as {
    artist?: SpotifyArtist
    album?: SpotifyAlbum
  }

  // Settings state
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [availableRoundOptions, setAvailableRoundOptions] = useState<RoundOption[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(true)
  const [trackCount, setTrackCount] = useState(0)

  // Time options for UI
  const timeOptions: Array<{ value: TimeSetting; label: string; sublabel: string }> = [
    { value: 'quick', label: 'Quick', sublabel: '10 seconds per round' },
    { value: 'normal', label: 'Normal', sublabel: '20 seconds per round' },
    { value: 'relaxed', label: 'Relaxed', sublabel: '30 seconds per round' },
  ]

  // Fetch track count to determine available options
  useEffect(() => {
    async function fetchTrackCount() {
      if (!artist) {
        navigate('/')
        return
      }

      try {
        setIsLoadingTracks(true)

        // Fetch tracks to get count
        const tracks = await getTracksForMode('genre', artist.id, album?.id)
        const count = tracks.length

        setTrackCount(count)

        // Calculate available options based on track count
        const options = getAvailableRoundOptions(count)
        setAvailableRoundOptions(options)

        // Try to load last used settings, otherwise use defaults
        const lastSettings = loadLastSettings()
        let initialSettings: GameSettings

        if (lastSettings) {
          // Validate that the last settings are compatible with current track count
          const isValidOption = options.some((opt) => opt.value === lastSettings.rounds)
          if (isValidOption) {
            initialSettings = lastSettings
          } else {
            // Fall back to default for this track count
            initialSettings = {
              ...lastSettings,
              rounds: getDefaultRoundSetting(count),
            }
          }
        } else {
          // Use default, but adjust rounds based on track count
          initialSettings = {
            ...DEFAULT_SETTINGS,
            rounds: getDefaultRoundSetting(count),
          }
        }

        setSettings(initialSettings)
      } catch (error) {
        console.error('Error fetching tracks:', error)
        navigate('/')
      } finally {
        setIsLoadingTracks(false)
      }
    }

    fetchTrackCount()
  }, [artist, album, navigate])

  const handleBack = () => {
    navigate(-1)
  }

  const handleStartGame = () => {
    // Save settings for next time
    saveLastSettings(settings)

    // Navigate to game with settings
    navigate('/game', {
      state: {
        mode: 'genre',
        artist,
        album,
        settings,
      },
    })
  }

  const updateRounds = (rounds: RoundSetting) => {
    setSettings((prev) => ({ ...prev, rounds }))
  }

  const updateTime = (timePerRound: TimeSetting) => {
    setSettings((prev) => ({ ...prev, timePerRound }))
  }

  const togglePause = () => {
    setSettings((prev) => ({ ...prev, allowPause: !prev.allowPause }))
  }

  if (isLoadingTracks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-md text-primary animate-pulse" />
          <p className="text-white/70">Loading tracks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <Container className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back Button */}
          <div className="mb-md">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-sm" />
              Back
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-xl">
            <h2 className="text-2xl font-bold mb-md">Game Settings</h2>
            <div className="text-white/70">
              <p className="mb-xs">
                <span className="text-primary font-semibold">{artist?.name}</span>
                {album && (
                  <>
                    {' '}
                    • <span className="text-white/90">{album.name}</span>
                  </>
                )}
              </p>
              <p className="text-sm">
                {trackCount} {trackCount === 1 ? 'track' : 'tracks'} available
              </p>
            </div>
          </div>

          {/* Settings Form */}
          <div className="max-w-2xl mx-auto space-y-xl">
            {/* Number of Rounds */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-md flex items-center gap-sm">
                <Music className="w-5 h-5 text-primary" />
                Number of Rounds
              </h3>
              <div className="grid grid-cols-1 gap-sm">
                {availableRoundOptions.map((option) => {
                  const isSelected = settings.rounds === option.value
                  return (
                    <Card
                      key={option.value}
                      variant="glass"
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-primary bg-primary/10'
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => updateRounds(option.value)}
                    >
                      <div className="flex items-center justify-between p-md">
                        <div>
                          <h4 className="font-semibold flex items-center gap-sm">
                            {option.label}
                            {option.recommended && (
                              <span className="text-xs bg-primary/20 text-primary px-sm py-xs rounded-full">
                                ⭐ Recommended
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-white/70">{option.sublabel}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </motion.div>

            {/* Time to Answer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-md flex items-center gap-sm">
                <Clock className="w-5 h-5 text-primary" />
                Time to Answer
              </h3>
              <div className="grid grid-cols-1 gap-sm">
                {timeOptions.map((option) => {
                  const isSelected = settings.timePerRound === option.value
                  return (
                    <Card
                      key={option.value}
                      variant="glass"
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-primary bg-primary/10'
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => updateTime(option.value)}
                    >
                      <div className="flex items-center justify-between p-md">
                        <div>
                          <h4 className="font-semibold">{option.label}</h4>
                          <p className="text-sm text-white/70">{option.sublabel}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </motion.div>

            {/* Allow Pause */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-md flex items-center gap-sm">
                <Pause className="w-5 h-5 text-primary" />
                Gameplay
              </h3>
              <Card variant="glass">
                <label className="flex items-center justify-between p-md cursor-pointer hover:bg-white/5 transition-colors rounded-lg">
                  <div>
                    <h4 className="font-semibold">Allow Manual Pause</h4>
                    <p className="text-sm text-white/70">
                      Enable ability to pause/resume during gameplay
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowPause}
                    onChange={togglePause}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
              </Card>
            </motion.div>
          </div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-xl"
          >
            <Button size="lg" onClick={handleStartGame} className="w-full max-w-md mx-auto block">
              Start Game
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}
