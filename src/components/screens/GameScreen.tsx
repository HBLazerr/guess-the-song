import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Trophy, Zap, X, Mic, Grid3x3 } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import ProgressBar from '../ui/ProgressBar'
import SoundWave from '../SoundWave'
import DynamicIslandVisualizer from '../DynamicIslandVisualizer'
import VoiceInput from '../VoiceInput'
import BrowseSelection, { type BrowseOption } from '../BrowseSelection'
import { useSpotify } from '@/hooks/useSpotify'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import type { GameMode, Track, SpotifyArtist, SpotifyAlbum } from '@/types'

export default function GameScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getTracksForMode } = useSpotify()
  const { playTrack, pause, isReady, error: playerError } = useSpotifyPlayer()

  const mode = (location.state?.mode as GameMode) || 'artist'
  const selectedArtist = location.state?.artist as SpotifyArtist | undefined
  const selectedAlbum = location.state?.album as SpotifyAlbum | undefined

  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your quiz...')
  const [showFeedback, setShowFeedback] = useState(false)
  const [inputMethod, setInputMethod] = useState<'voice' | 'browse'>('voice')

  // Hierarchical navigation state (for track mode with artist-only selection)
  const [browseAlbum, setBrowseAlbum] = useState<BrowseOption | null>(null)
  const showingAlbums = mode === 'genre' && selectedArtist && !selectedAlbum && !browseAlbum

  const fetchingRef = useRef(false)

  // Determine useSpotifyData options based on selection and navigation state
  const dataOptions = {
    artistId: selectedArtist?.id,
    albumId: browseAlbum?.id || selectedAlbum?.id,
    fetchAlbums: showingAlbums,
  }
  const { options: browseOptions } = useSpotifyData(mode, dataOptions)

  const {
    currentQuestion,
    currentRound,
    totalRounds,
    timeRemaining,
    score,
    streak,
    isPlaying,
    isPaused,
    gameResult,
    startRound,
    handleAnswer,
    pauseGame,
    resumeGame,
  } = useGameLogic(tracks, mode)

  // Load tracks on mount
  useEffect(() => {
    // Prevent duplicate fetches (React StrictMode runs effects twice)
    if (fetchingRef.current) {
      console.log('[Game] Skipping duplicate fetch')
      return
    }

    fetchingRef.current = true
    const modeLabel = mode === 'artist' ? 'artists' : mode === 'album' ? 'albums' : 'tracks'
    setLoadingMessage(`Fetching your top ${modeLabel}...`)

    getTracksForMode(mode, selectedArtist?.id, selectedAlbum?.id)
      .then((fetchedTracks) => {
        setLoadingMessage('Finding tracks with audio previews...')

        console.log(`[Game] Received ${fetchedTracks.length} tracks with preview URLs for ${mode} mode`)

        if (fetchedTracks.length < 4) {
          // More helpful error messages
          let message = ''
          if (fetchedTracks.length === 0) {
            message = `No tracks with audio previews were found for ${mode} mode.\n\n` +
              `This can happen if:\n` +
              `• Your Spotify listening history is limited\n` +
              `• Tracks don't have preview clips available\n` +
              `• Regional restrictions apply\n\n` +
              `💡 Try "Artist Mode" which usually finds more tracks,\n` +
              `or listen to more music on Spotify!`
          } else {
            message = `Only ${fetchedTracks.length} track${fetchedTracks.length === 1 ? '' : 's'} with audio previews ${fetchedTracks.length === 1 ? 'was' : 'were'} found.\n\n` +
              `We need at least 4 tracks to create a quiz.\n\n` +
              `💡 Tip: Try "Artist Mode" for better results!`
          }

          alert(message)
          navigate('/')
          return
        }

        setLoadingMessage('Preparing your quiz...')
        setTimeout(() => {
          setTracks(fetchedTracks)
          setIsLoadingTracks(false)
        }, 500)
      })
      .catch((error) => {
        console.error('Failed to load tracks:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Check for rate limiting
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          alert(
            `Spotify rate limit reached.\n\n` +
            `We made too many requests too quickly.\n\n` +
            `Please wait a moment and try again.`
          )
        } else {
          alert(
            `Failed to load tracks: ${errorMessage}\n\n` +
            `Please check your internet connection and try again.\n\n` +
            `If the problem persists, try signing out and back in.`
          )
        }
        fetchingRef.current = false // Reset on error so user can retry
        navigate('/')
      })
  }, [mode, getTracksForMode, navigate])

  // Start first round when tracks are loaded
  useEffect(() => {
    if (!isLoadingTracks && tracks.length > 0 && currentRound === 1 && !isPlaying) {
      setTimeout(() => startRound(), 1000)
    }
  }, [isLoadingTracks, tracks, currentRound, isPlaying, startRound])

  // Handle audio playback with Web Playback SDK
  useEffect(() => {
    if (currentQuestion && isPlaying && !isPaused) {
      if (!isReady) {
        console.log('[Playback] Player not ready yet, waiting...')
        return
      }

      // Use the calculated best start time (in seconds) and convert to milliseconds
      const startTime = currentQuestion.track.startTime || 30
      const startTimeMs = startTime * 1000

      console.log(`[Playback] Starting "${currentQuestion.track.name}" at ${startTime}s (${startTimeMs}ms) via Web Playback SDK`)

      // Play track using Web Playback SDK
      playTrack(currentQuestion.track.id, startTimeMs)
    } else if (isPaused || !isPlaying) {
      // Pause when paused or not playing
      pause()
    }

    return () => {
      pause()
    }
  }, [currentQuestion, isPlaying, isPaused, isReady, playTrack, pause])

  // Navigate to results when game is complete
  useEffect(() => {
    if (gameResult) {
      navigate('/results', { state: { result: gameResult } })
    }
  }, [gameResult, navigate])

  const handleAnswerClick = (answer: string) => {
    if (!isPlaying || showFeedback) return

    setShowFeedback(true)
    handleAnswer(answer)

    // Reset for next round
    setTimeout(() => {
      setShowFeedback(false)
    }, 1500)
  }

  const handleAlbumSelect = (album: BrowseOption) => {
    setBrowseAlbum(album)
  }

  const handleBackToAlbums = () => {
    setBrowseAlbum(null)
  }

  const handleQuit = () => {
    const confirmQuit = window.confirm(
      'Are you sure you want to quit?\n\nYour progress will be lost.'
    )
    if (confirmQuit) {
      pause() // Stop any playing music
      navigate('/')
    }
  }

  if (isLoadingTracks || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <SoundWave isPlaying={true} className="mb-lg" />
          <p className="text-lg text-white/70">
            {isLoadingTracks ? loadingMessage : 'Connecting to Spotify player...'}
          </p>
          <p className="text-sm text-white/50 mt-md">This may take a moment...</p>
          {playerError && (
            <p className="text-sm text-red-500 mt-md">{playerError}</p>
          )}
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-white/70">Preparing quiz...</p>
      </div>
    )
  }

  const progressPercent = (currentRound / totalRounds) * 100

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <Container className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Stats */}
          <div className="flex items-center justify-between mb-lg">
            <div className="flex items-center gap-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuit}
                className="mr-sm"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-sm">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">{score}</span>
              </div>
              <div className="flex items-center gap-sm">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold">{streak}</span>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-sm"
              animate={{
                scale: timeRemaining <= 10 ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: timeRemaining <= 5 ? 0.5 : 0.8,
                repeat: timeRemaining <= 10 ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <Clock
                className={`w-6 h-6 ${
                  timeRemaining <= 5 ? 'text-red-500' :
                  timeRemaining <= 10 ? 'text-yellow-500' :
                  timeRemaining <= 20 ? 'text-yellow-400' :
                  'text-green-500'
                }`}
              />
              <span
                className={`text-2xl font-bold ${
                  timeRemaining <= 5 ? 'text-red-500' :
                  timeRemaining <= 10 ? 'text-yellow-500' :
                  timeRemaining <= 20 ? 'text-yellow-400' :
                  'text-green-500'
                }`}
              >
                {timeRemaining}s
              </span>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mb-xl">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-sm text-white/70">
                Round {currentRound} of {totalRounds}
              </span>
              <span className="text-sm text-white/70">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <ProgressBar progress={progressPercent} variant="primary" />
          </div>

          {/* Dynamic Island Visualization */}
          <Card
            variant="glass"
            className="mb-xl cursor-pointer"
            onClick={() => {
              if (isPlaying && !showFeedback) {
                if (isPaused) {
                  resumeGame()
                } else {
                  pauseGame()
                }
              }
            }}
          >
            <div className="text-center py-xl">
              <DynamicIslandVisualizer
                isPlaying={isPlaying && !isPaused}
                className="mb-md"
              />

              {/* Pause hint text */}
              {isPlaying && (
                <motion.p
                  className={`text-sm mb-lg ${
                    isPaused ? 'text-yellow-400 font-medium' : 'text-white/50'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    scale: isPaused ? [1, 1.02, 1] : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: {
                      duration: 1.5,
                      repeat: isPaused ? Infinity : 0,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  {isPaused ? '⏸ Paused • Tap to resume' : 'Playing... (tap to pause)'}
                </motion.p>
              )}

              <p className="text-xl font-semibold">
                {mode === 'artist' && 'Who is the artist?'}
                {mode === 'album' && 'What album is this from?'}
                {mode === 'genre' && 'What is this track called?'}
              </p>
            </div>
          </Card>

          {/* Input Method Toggle */}
          <div className="flex justify-center gap-sm mb-lg">
            <Button
              variant={inputMethod === 'voice' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setInputMethod('voice')}
              disabled={!isPlaying || showFeedback}
              className="flex items-center gap-sm"
            >
              <Mic className="w-4 h-4" />
              Voice
            </Button>
            <Button
              variant={inputMethod === 'browse' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setInputMethod('browse')}
              disabled={!isPlaying || showFeedback}
              className="flex items-center gap-sm"
            >
              <Grid3x3 className="w-4 h-4" />
              Browse
            </Button>
          </div>

          {/* Input Area */}
          {inputMethod === 'voice' ? (
            <VoiceInput
              key={currentRound}
              possibleAnswers={currentQuestion.options}
              onAnswer={handleAnswerClick}
              onSwitchToBrowse={() => setInputMethod('browse')}
              disabled={!isPlaying || showFeedback}
            />
          ) : (
            <BrowseSelection
              key={currentRound}
              options={browseOptions}
              mode={mode}
              onSelect={handleAnswerClick}
              disabled={!isPlaying || showFeedback}
              hierarchical={
                selectedArtist && !selectedAlbum
                  ? {
                      showingAlbums: showingAlbums || false,
                      selectedAlbum: browseAlbum || undefined,
                      onAlbumSelect: handleAlbumSelect,
                      onBack: handleBackToAlbums,
                    }
                  : undefined
              }
            />
          )}
        </motion.div>
      </Container>
    </div>
  )
}
