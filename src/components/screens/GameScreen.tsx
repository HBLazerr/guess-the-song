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
import SongGuessInput from '../SongGuessInput'
import BrowseSelection from '../BrowseSelection'
import AnswerReveal from '../AnswerReveal'
import type { BrowseOption } from '../BrowseSelection'
import { useSpotify } from '@/hooks/useSpotify'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { saveGameState, loadGameState, clearGameState } from '@/lib/gameState'
import type { GameMode, Track, SpotifyArtist, SpotifyAlbum } from '@/types'

export default function GameScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getTracksForMode } = useSpotify()
  const { playTrack, pause, isReady, error: playerError } = useSpotifyPlayer()

  // Check if this is a "play again" request
  const isPlayAgain = location.state?.playAgain === true
  
  // Clear saved state if starting a new game (not play again)
  useEffect(() => {
    if (!isPlayAgain) {
      clearGameState()
    }
  }, [isPlayAgain])
  
  // Try to load saved game state first if play again
  const savedState = isPlayAgain ? loadGameState() : null
  
  const mode = savedState?.mode || (location.state?.mode as GameMode) || 'artist'
  const selectedArtist = savedState?.artist || (location.state?.artist as SpotifyArtist | undefined)
  const selectedAlbum = savedState?.album || (location.state?.album as SpotifyAlbum | undefined)

  const [tracks, setTracks] = useState<Track[]>(savedState?.tracks || [])
  const [isLoadingTracks, setIsLoadingTracks] = useState(!savedState)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your quiz...')
  const [showFeedback, setShowFeedback] = useState(false)
  const [inputMethod, setInputMethod] = useState<'voice' | 'browse'>('browse')
  const [answerFeedback, setAnswerFeedback] = useState<{
    selectedAnswer: string
    isCorrect: boolean
  } | null>(null)

  const fetchingRef = useRef(false)
  const hasStartedRef = useRef(false)
  const processingAnswerRef = useRef(false)

  // Fetch options for autocomplete dropdown
  const dataOptions = {
    artistId: selectedArtist?.id,
    albumId: selectedAlbum?.id,
    fetchAlbums: false, // Always fetch tracks/artists/albums based on mode
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
    // If we have saved state from play again, use it
    if (savedState && savedState.tracks.length > 0 && isPlayAgain) {
      console.log('[Game] Using saved game state for play again')
      setTracks(savedState.tracks)
      setIsLoadingTracks(false)
      return
    }

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
          
          // Save game state for play again functionality
          saveGameState({
            tracks: fetchedTracks,
            mode,
            artist: selectedArtist,
            album: selectedAlbum,
            timestamp: Date.now(),
          })
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
  }, [mode, getTracksForMode, navigate, selectedArtist, selectedAlbum, savedState])

  // Start first round when tracks are loaded
  useEffect(() => {
    if (!isLoadingTracks && tracks.length > 0 && currentRound === 1 && !isPlaying && !hasStartedRef.current) {
      hasStartedRef.current = true
      setTimeout(() => startRound(), 1000)
    }

    // Reset when game resets
    if (currentRound > 1) {
      hasStartedRef.current = false
    }
  }, [isLoadingTracks, tracks, currentRound, isPlaying, startRound])

  // Handle audio playback with Web Playback SDK
  useEffect(() => {
    if (currentQuestion && isPlaying && !isPaused && isReady) {
      // Use the calculated best start time (in seconds) and convert to milliseconds
      const startTime = currentQuestion.track.startTime || 30
      const startTimeMs = startTime * 1000

      console.log(`[Playback] Starting "${currentQuestion.track.name}" at ${startTime}s (${startTimeMs}ms) via Web Playback SDK`)

      // Play track using Web Playback SDK
      playTrack(currentQuestion.track.id, startTimeMs)
    } else if ((isPaused || !isPlaying) && isReady) {
      // Only pause when player is ready AND we're in pause state
      pause()
    }

    // Cleanup: pause when unmounting ONLY if player is ready
    return () => {
      if (isReady) {
        pause()
      }
    }
  }, [currentQuestion, isPlaying, isPaused, isReady, playTrack, pause])

  // Navigate to results when game is complete
  useEffect(() => {
    if (gameResult) {
      navigate('/results', { state: { result: gameResult } })
    }
  }, [gameResult, navigate])

  const handleAnswerClick = (answer: string) => {
    if (!isPlaying || showFeedback || !currentQuestion) return

    // Prevent duplicate answer processing
    if (processingAnswerRef.current) {
      console.log('[Game] Ignoring duplicate answer submission')
      return
    }

    processingAnswerRef.current = true
    console.log('[Game] Processing answer:', answer)

    // Determine if the answer is correct
    const isCorrect = answer === currentQuestion.correctAnswer

    // Set feedback state for visual feedback
    setAnswerFeedback({
      selectedAnswer: answer,
      isCorrect,
    })

    setShowFeedback(true)
    handleAnswer(answer)

    // Reset for next round - wait for reveal animation
    // Note: Must complete AFTER round changes in useGameLogic (2000ms)
    setTimeout(() => {
      setShowFeedback(false)
      setAnswerFeedback(null)
      processingAnswerRef.current = false
      console.log('[Game] Ready for next answer')
    }, 2100)
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
              variant={inputMethod === 'browse' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setInputMethod('browse')}
              disabled={!isPlaying || showFeedback}
              className="flex items-center gap-sm"
            >
              <Grid3x3 className="w-4 h-4" />
              Browse
            </Button>
            <Button
              variant={inputMethod === 'voice' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setInputMethod('voice')}
              disabled={!isPlaying || showFeedback}
              className="flex items-center gap-sm"
            >
              <Mic className="w-4 h-4" />
              Voice (beta)
            </Button>
          </div>

          {/* Input Area - Hide completely during feedback */}
          {!showFeedback && (
            <>
              {inputMethod === 'voice' ? (
                <VoiceInput
                  key={currentRound}
                  possibleAnswers={currentQuestion.options}
                  onAnswer={handleAnswerClick}
                  onSwitchToBrowse={() => setInputMethod('browse')}
                  disabled={!isPlaying}
                  answerFeedback={answerFeedback}
                />
              ) : (
                <>
                  {/* Autocomplete Input for Song Guessing */}
                  <div key="song-guess-input-container">
                    <SongGuessInput
                      key={currentRound}
                      options={browseOptions}
                      onSelect={handleAnswerClick}
                      disabled={!isPlaying}
                      answerFeedback={answerFeedback}
                      label={
                        mode === 'artist'
                          ? 'The artist is...'
                          : mode === 'album'
                          ? 'The album is called...'
                          : 'The song is called...'
                      }
                    />
                  </div>

                  {/* Separator */}
                  <div className="my-lg">
                    <div className="flex items-center gap-md">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">
                        Or Browse Below
                      </span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                  </div>

                  {/* Browse Grid - NO SEARCH BAR */}
                  <div key="browse-selection-container">
                    <BrowseSelection
                      key={currentRound}
                      options={browseOptions}
                      mode={mode}
                      onSelect={handleAnswerClick}
                      disabled={!isPlaying}
                      showSearch={false}
                      answerFeedback={answerFeedback}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* Answer Reveal Overlay */}
        <AnswerReveal
          key={currentRound}
          show={showFeedback && answerFeedback !== null}
          isCorrect={answerFeedback?.isCorrect || false}
          correctAnswer={currentQuestion.correctAnswer}
          trackName={currentQuestion.track.name}
          artistName={currentQuestion.track.artists[0]}
          albumArt={currentQuestion.track.album_art}
        />
      </Container>
    </div>
  )
}
