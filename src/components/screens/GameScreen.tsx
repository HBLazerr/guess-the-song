import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trophy, Zap, X, Mic, Grid3x3, ArrowLeft } from 'lucide-react'
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
import LiquidEther from '../LiquidEther'
import type { BrowseOption } from '../BrowseSelection'
import { useSpotify } from '@/hooks/useSpotify'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { DEFAULT_SETTINGS, getTimeInSeconds } from '@/lib/gameSettings'
import { isMatch } from '@/lib/fuzzyMatch'
import type { GameMode, Track, SpotifyArtist, SpotifyAlbum, GameSettings } from '@/types'

export default function GameScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getTracksForMode } = useSpotify()
  const { playTrack, pause, resume, isReady, error: playerError } = useSpotifyPlayer()

  const mode = (location.state?.mode as GameMode) || 'artist'
  const selectedArtist = location.state?.artist as SpotifyArtist | undefined
  const selectedAlbum = location.state?.album as SpotifyAlbum | undefined
  const gameSettings = (location.state?.settings as GameSettings | undefined) || DEFAULT_SETTINGS

  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your quiz...')
  const [showFeedback, setShowFeedback] = useState(false)
  const [inputMethod, setInputMethod] = useState<'voice' | 'browse'>('browse')
  const [answerFeedback, setAnswerFeedback] = useState<{
    selectedAnswer: string
    isCorrect: boolean
  } | null>(null)

  // Browse navigation state for two-step album→song selection (All Albums mode)
  const [browseView, setBrowseView] = useState<'albums' | 'songs'>('albums')
  const [selectedBrowseAlbum, setSelectedBrowseAlbum] = useState<BrowseOption | null>(null)

  // Sticky header state
  const [isSticky, setIsSticky] = useState(false)
  const controlsRef = useRef<HTMLDivElement>(null)

  const fetchingRef = useRef(false)
  const hasStartedRef = useRef(false)
  const processingAnswerRef = useRef(false)

  // Detect "All Albums" mode (genre mode with artist selected but no specific album)
  const isAllAlbumsMode = mode === 'genre' && selectedArtist?.id && !selectedAlbum?.id

  // Browse grid options - In "All Albums" mode, fetch albums first, then songs from selected album
  const browseDataOptions = {
    artistId: selectedArtist?.id,
    albumId: isAllAlbumsMode
      ? selectedBrowseAlbum?.id  // Use browse-selected album for songs
      : selectedAlbum?.id,        // Use home-selected album for songs
    fetchAlbums: (isAllAlbumsMode && browseView === 'albums') || false, // Fetch albums in first step
  }
  const { options: browseOptions } = useSpotifyData(mode, browseDataOptions)

  // Search autocomplete options - ALWAYS show all songs (not filtered by selected album)
  const searchDataOptions = {
    artistId: selectedArtist?.id,
    albumId: isAllAlbumsMode ? undefined : selectedAlbum?.id, // Don't filter by album in All Albums mode
    fetchAlbums: false, // Never fetch albums for search
  }
  const { options: searchOptions } = useSpotifyData(mode, searchDataOptions)

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
  } = useGameLogic(tracks, mode, gameSettings)

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
        // Start immediately - no artificial delay
        setTracks(fetchedTracks)
        setIsLoadingTracks(false)
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
  }, [mode, getTracksForMode, navigate, selectedArtist, selectedAlbum])

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

  // Track whether current track has been started
  const trackStartedRef = useRef(false)
  const currentTrackIdRef = useRef<string | null>(null)

  // Handle audio playback with Web Playback SDK
  useEffect(() => {
    if (currentQuestion && isPlaying && !isPaused && isReady) {
      const currentTrackId = currentQuestion.track.id

      // Check if this is a new track or just resuming
      if (currentTrackIdRef.current !== currentTrackId || !trackStartedRef.current) {
        // New track - start from beginning
        const startTime = currentQuestion.track.startTime || 30
        const startTimeMs = startTime * 1000

        console.log(`[Playback] Starting "${currentQuestion.track.name}" at ${startTime}s (${startTimeMs}ms) via Web Playback SDK`)

        // Play track using Web Playback SDK
        playTrack(currentQuestion.track.id, startTimeMs)
        trackStartedRef.current = true
        currentTrackIdRef.current = currentTrackId
      } else {
        // Same track - just resume from current position
        console.log(`[Playback] Resuming "${currentQuestion.track.name}" from current position`)
        resume()
      }
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
  }, [currentQuestion, isPlaying, isPaused, isReady, playTrack, pause, resume])

  // Reset track started ref when question changes
  useEffect(() => {
    if (currentQuestion) {
      trackStartedRef.current = false
      currentTrackIdRef.current = null
    }
  }, [currentQuestion])

  // Auto-scroll to top on round transition for better UX
  useEffect(() => {
    if (currentRound > 0 && !gameResult) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentRound, gameResult])

  // Handle sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (controlsRef.current) {
        const rect = controlsRef.current.getBoundingClientRect()
        // Make sticky when the controls scroll past the top of viewport
        setIsSticky(rect.top <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigate to results when game is complete
  useEffect(() => {
    if (gameResult) {
      navigate('/results', { state: { result: gameResult } })
    }
  }, [gameResult, navigate])

  // Reset browse navigation on new round (All Albums mode)
  useEffect(() => {
    if (isAllAlbumsMode) {
      setBrowseView('albums')
      setSelectedBrowseAlbum(null)
    }
  }, [currentRound, isAllAlbumsMode])

  const handleAnswerClick = (answer: string, source: 'search' | 'browse' | 'voice' = 'browse') => {
    // If in All Albums mode and viewing albums, drill down when clicking from browse grid
    // Skip this logic for search autocomplete and voice input
    if (source === 'browse' && isAllAlbumsMode && browseView === 'albums') {
      const album = browseOptions.find(opt => opt.name === answer)
      if (album) {
        console.log('[Game] Album selected for browsing:', album.name)
        setSelectedBrowseAlbum(album)
        setBrowseView('songs')
        return // Don't process as answer
      }
    }

    if (!isPlaying || showFeedback || !currentQuestion) return

    // Prevent duplicate answer processing
    if (processingAnswerRef.current) {
      console.log('[Game] Ignoring duplicate answer submission')
      return
    }

    processingAnswerRef.current = true
    console.log('[Game] Processing answer:', answer)

    // Determine if the answer is correct - check against all acceptable variations
    const isCorrect = currentQuestion.correctAnswers.some(correct => {
      // Exact match
      if (answer === correct) return true

      // Fuzzy match as fallback (handles typos) - only for genre mode
      if (mode === 'genre') {
        return isMatch(answer, correct, 0.3)
      }

      return false
    })

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

  // Calculate dynamic timer color thresholds based on time setting
  const totalTime = getTimeInSeconds(gameSettings.timePerRound)
  const criticalThreshold = Math.ceil(totalTime * 0.25) // Last 25% = red
  const warningThreshold = Math.ceil(totalTime * 0.5)   // Last 50% = yellow

  // Determine timer color based on dynamic thresholds
  const getTimerColor = () => {
    if (timeRemaining <= criticalThreshold) return 'text-red-500'
    if (timeRemaining <= warningThreshold) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="min-h-screen bg-background p-lg relative">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-25">
        <LiquidEther
          colors={['#1DB954', '#1ed760', '#169c46']}
          mouseForce={30}
          cursorSize={150}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.0}
        />
      </div>

      {/* Content */}
      <Container className="max-w-4xl relative z-10 py-lg">
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
                <span className="text-lg font-semibold">{isNaN(score) ? 0 : score}</span>
              </div>
              <div className="flex items-center gap-sm">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold">{streak}</span>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-sm"
              animate={{
                scale: timeRemaining <= criticalThreshold ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: timeRemaining <= criticalThreshold ? 0.5 : 0.8,
                repeat: timeRemaining <= criticalThreshold ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <Clock className={`w-6 h-6 ${getTimerColor()}`} />
              <span className={`text-2xl font-bold ${getTimerColor()}`}>
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
          <div ref={controlsRef} className="relative mb-xl">
            <Card
              variant="glass"
              className={`${gameSettings.allowPause && isPlaying && !showFeedback ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (gameSettings.allowPause && isPlaying && !showFeedback) {
                  if (isPaused) {
                    resumeGame()
                  } else {
                    pauseGame()
                  }
                }
              }}
            >
              <div className={`text-center transition-all duration-300 ${isSticky ? 'py-md' : 'py-xl'}`}>
                <DynamicIslandVisualizer
                  isPlaying={isPlaying && !isPaused}
                  className={isSticky ? 'mb-0 scale-75' : 'mb-md'}
                />

                {/* Pause hint text - only show if pause is allowed and not sticky */}
                {isPlaying && gameSettings.allowPause && !isSticky && (
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

                {!isSticky && (
                  <p className="text-xl font-semibold">
                    {mode === 'artist' && 'Who is the artist?'}
                    {mode === 'album' && 'What album is this from?'}
                    {mode === 'genre' && 'What is this track called?'}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sticky header version */}
          <AnimatePresence>
            {isSticky && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/10 px-lg py-md"
              >
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-md">
                  <div className="flex items-center gap-md flex-1">
                    <div
                      className={`${gameSettings.allowPause && isPlaying && !showFeedback ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (gameSettings.allowPause && isPlaying && !showFeedback) {
                          if (isPaused) {
                            resumeGame()
                          } else {
                            pauseGame()
                          }
                        }
                      }}
                    >
                      <DynamicIslandVisualizer
                        isPlaying={isPlaying && !isPaused}
                        className="scale-50"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {mode === 'artist' && 'Who is the artist?'}
                        {mode === 'album' && 'What album?'}
                        {mode === 'genre' && 'Track name?'}
                      </p>
                      {isPaused && (
                        <p className="text-xs text-yellow-400">⏸ Paused</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <div className="flex items-center gap-sm">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{isNaN(score) ? 0 : score}</span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Clock className={`w-4 h-4 ${getTimerColor()}`} />
                      <span className={`text-sm font-bold ${getTimerColor()}`}>
                        {timeRemaining}s
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  onAnswer={(answer) => handleAnswerClick(answer, 'voice')}
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
                      options={searchOptions}
                      onSelect={(answer) => handleAnswerClick(answer, 'search')}
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
                    {/* Back Button and Album Info (All Albums mode only) */}
                    {isAllAlbumsMode && browseView === 'songs' && (
                      <div className="mb-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBrowseView('albums')
                            setSelectedBrowseAlbum(null)
                          }}
                          disabled={!isPlaying || showFeedback}
                          className="mb-sm"
                        >
                          <ArrowLeft className="w-4 h-4 mr-sm" />
                          Back to Albums
                        </Button>
                        <p className="text-sm text-white/60">
                          Viewing songs from: <span className="font-semibold text-white/90">{selectedBrowseAlbum?.name}</span>
                        </p>
                      </div>
                    )}

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
