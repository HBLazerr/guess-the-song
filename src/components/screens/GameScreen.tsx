import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trophy, Zap, X } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import ProgressBar from '../ui/ProgressBar'
import SoundWave from '../SoundWave'
import DynamicIslandVisualizer from '../DynamicIslandVisualizer'
import { useSpotify } from '@/hooks/useSpotify'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useGameLogic } from '@/hooks/useGameLogic'
import type { GameMode, Track } from '@/types'

export default function GameScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getTracksForMode } = useSpotify()
  const { playTrack, pause, isReady, error: playerError } = useSpotifyPlayer()

  const mode = (location.state?.mode as GameMode) || 'artist'
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your quiz...')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const fetchingRef = useRef(false)

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

    getTracksForMode(mode)
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

    setSelectedAnswer(answer)
    setShowFeedback(true)
    handleAnswer(answer)

    // Reset for next round
    setTimeout(() => {
      setSelectedAnswer(null)
      setShowFeedback(false)
    }, 1500)
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
  const timePercent = (timeRemaining / 30) * 100

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

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <AnimatePresence>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrect = option === currentQuestion.correctAnswer
                const showCorrect = showFeedback && isCorrect
                const showWrong = showFeedback && isSelected && !isCorrect

                return (
                  <motion.div
                    key={`${currentQuestion.round}-${option}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full h-auto min-h-[60px] text-left justify-start px-lg py-md ${
                        showCorrect
                          ? 'bg-green-500/20 ring-2 ring-green-500'
                          : showWrong
                          ? 'bg-red-500/20 ring-2 ring-red-500'
                          : isSelected
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => handleAnswerClick(option)}
                      disabled={!isPlaying || showFeedback}
                    >
                      <span className="text-base font-normal break-words">{option}</span>
                    </Button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </Container>
    </div>
  )
}
