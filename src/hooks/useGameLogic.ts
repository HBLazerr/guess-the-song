import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Track, QuizQuestion, RoundResult, GameResult, GameMode, GameSettings } from '@/types'
import { shuffleArray, calculateScore, normalizeTrackName } from '@/lib/utils'
import { isMatch } from '@/lib/fuzzyMatch'
import { getTimeInSeconds, getRoundsCount, PAUSE_BETWEEN_ROUNDS } from '@/lib/gameSettings'

export function useGameLogic(tracks: Track[], mode: GameMode, settings: GameSettings) {
  // Extract settings values
  const ROUND_TIME = getTimeInSeconds(settings.timePerRound)

  // Calculate rounds based on settings
  const totalRounds = useMemo(() => {
    return getRoundsCount(settings.rounds, tracks.length)
  }, [tracks.length, settings.rounds])

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  // Generate quiz questions from tracks
  const generateQuestions = useCallback(() => {
    if (tracks.length < 4) return []

    // Deduplicate tracks for question selection in genre mode
    // This prevents songs like "J.", "J. - Deluxe", "J. - Remix" from all appearing as separate questions
    // But we keep the original tracks array for building correctAnswers (preserving variations)
    let tracksForQuestions = tracks
    if (mode === 'genre') {
      const trackMap = new Map<string, Track>()
      tracks.forEach(track => {
        const normalizedName = normalizeTrackName(track.name)
        const key = `${normalizedName}-${track.artists[0].toLowerCase()}`
        if (!trackMap.has(key)) {
          trackMap.set(key, track) // Keep first occurrence (cleanest version preferred)
        }
      })
      tracksForQuestions = Array.from(trackMap.values())
      console.log(`[Game Logic] Deduplicated ${tracks.length} → ${tracksForQuestions.length} tracks for question selection`)
    }

    const shuffledTracks = shuffleArray(tracksForQuestions)
    const selectedTracks = shuffledTracks.slice(0, Math.min(totalRounds, tracksForQuestions.length))

    return selectedTracks.map((track, index) => {
      let correctAnswer: string
      let getOptionValue: (t: Track) => string

      // Determine correct answer and option extractor based on mode
      if (mode === 'artist') {
        correctAnswer = track.artists[0]
        getOptionValue = (t) => t.artists[0]
      } else if (mode === 'album') {
        correctAnswer = track.album
        getOptionValue = (t) => t.album
      } else {
        // genre mode - use track name
        correctAnswer = track.name
        getOptionValue = (t) => t.name
      }

      // Build correctAnswers array - find all acceptable variations
      let correctAnswers: string[] = [correctAnswer]

      if (mode === 'genre') {
        // For genre mode, find all tracks by the same artist with matching normalized names
        const normalizedCorrect = normalizeTrackName(correctAnswer)
        console.log(`[Game Logic] Round ${index + 1}: Normalizing "${correctAnswer}" → "${normalizedCorrect}"`)

        const similarTracks = tracks.filter(t => {
          const sameArtist = t.artists[0] === track.artists[0]
          const normalizedOption = normalizeTrackName(getOptionValue(t))
          const sameNormalizedName = normalizedOption === normalizedCorrect

          // Debug log for tracks with similar names but different artists
          if (sameNormalizedName && !sameArtist) {
            console.log(`[Game Logic] Skipping "${t.name}" by "${t.artists[0]}" (different artist)`)
          }

          return sameArtist && sameNormalizedName
        })

        // Get all unique variations of the song name
        const variations = new Set<string>(similarTracks.map(t => t.name))
        correctAnswers = Array.from(variations)

        console.log(`[Game Logic] ✓ Found ${correctAnswers.length} variation(s) for "${correctAnswer}":`, correctAnswers)
        if (correctAnswers.length === 1) {
          console.log(`[Game Logic] ⚠️ Only 1 variation found - searching all ${tracks.length} tracks for artist "${track.artists[0]}"`)
          // Additional debug: show first 5 tracks by this artist
          const artistTracks = tracks.filter(t => t.artists[0] === track.artists[0]).slice(0, 5)
          console.log(`[Game Logic] Sample tracks by this artist:`, artistTracks.map(t => ({ name: t.name, normalized: normalizeTrackName(t.name) })))
        }
      }

      // Collect unique wrong answers (avoid duplicates and exclude all correct variations)
      const correctAnswersSet = new Set(correctAnswers)
      const uniqueOptions = new Set<string>([correctAnswer])
      const wrongAnswers: string[] = []

      for (const t of shuffledTracks) {
        if (t.id === track.id) continue // Skip the correct track

        const optionValue = getOptionValue(t)

        // Skip if this is one of the correct answer variations
        if (correctAnswersSet.has(optionValue)) continue

        if (!uniqueOptions.has(optionValue)) {
          uniqueOptions.add(optionValue)
          wrongAnswers.push(optionValue)

          // Stop when we have 3 unique wrong answers
          if (wrongAnswers.length >= 3) break
        }
      }

      // Build final options array
      const options = [correctAnswer, ...wrongAnswers]
      const shuffledOptions = shuffleArray(options).slice(0, 4)

      // VALIDATION: Ensure correct answer exists in shuffled options
      if (!shuffledOptions.includes(correctAnswer)) {
        console.error(
          `[Game Logic] Validation failed: Correct answer "${correctAnswer}" not in options:`,
          shuffledOptions,
          '\nTrack:',
          track.name,
          '\nAll options before shuffle:',
          options
        )
        // Force correct answer into a random position
        const randomIndex = Math.floor(Math.random() * shuffledOptions.length)
        shuffledOptions[randomIndex] = correctAnswer
        console.warn(`[Game Logic] Fixed: Inserted correct answer at index ${randomIndex}`)
      }

      return {
        track,
        options: shuffledOptions,
        correctAnswer,
        correctAnswers,
        round: index + 1,
      }
    })
  }, [tracks, mode, totalRounds])

  // Initialize questions
  useEffect(() => {
    if (tracks.length > 0) {
      const newQuestions = generateQuestions()
      setQuestions(newQuestions)
    }
  }, [tracks, mode, generateQuestions])

  // Timer logic
  useEffect(() => {
    if (!isPlaying || isPaused) return

    if (timeRemaining <= 0) {
      handleAnswer('') // Time's up, wrong answer
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isPaused, timeRemaining])

  const startRound = useCallback(() => {
    setIsPlaying(true)
    setIsPaused(false) // Always unpause when starting a new round
    setTimeRemaining(ROUND_TIME)
  }, [])

  const handleAnswer = useCallback((answer: string) => {
    if (!isPlaying || currentRound >= questions.length) return

    const question = questions[currentRound]

    // Check if answer matches any of the correct answers
    // This handles multiple variations of the same song (e.g., "Song", "Song - Deluxe", "Song (Remix)")
    let isCorrect = question.correctAnswers.some(correct => {
      // Exact match
      if (answer === correct) return true

      // Fuzzy match as fallback (handles typos)
      if (mode === 'genre') {
        return isMatch(answer, correct, 0.3)
      }

      return false
    })

    const newStreak = isCorrect ? streak + 1 : 0
    const points = calculateScore(isCorrect, timeRemaining, ROUND_TIME, streak)

    // Update streak
    setStreak(newStreak)
    if (newStreak > maxStreak) {
      setMaxStreak(newStreak)
    }

    // Update score
    setScore(prev => prev + points)

    // Record result
    const result: RoundResult = {
      round: currentRound + 1,
      track: question.track,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeRemaining,
      points,
      streak: newStreak,
    }

    setRoundResults(prev => [...prev, result])

    // Stop playing
    setIsPlaying(false)

    // Move to next round or finish game (with delay for answer reveal)
    if (currentRound + 1 >= questions.length) {
      // Last round - wait for answer reveal before showing results
      setTimeout(() => {
        finishGame([...roundResults, result])
      }, PAUSE_BETWEEN_ROUNDS)
    } else {
      setTimeout(() => {
        setCurrentRound(prev => prev + 1)
        startRound()
      }, PAUSE_BETWEEN_ROUNDS)
    }
  }, [currentRound, questions, isPlaying, timeRemaining, streak, maxStreak, roundResults, startRound, mode])

  const finishGame = (results: RoundResult[]) => {
    const correctAnswers = results.filter(r => r.isCorrect).length
    const accuracy = (correctAnswers / results.length) * 100

    // Calculate total score from all rounds (don't rely on state which may not be updated yet)
    const totalScore = results.reduce((sum, r) => sum + r.points, 0)

    // Calculate max streak from all rounds
    const calculatedMaxStreak = Math.max(...results.map(r => r.streak), 0)

    const result: GameResult = {
      totalScore,
      accuracy,
      maxStreak: calculatedMaxStreak,
      rounds: results,
      mode,
    }

    setGameResult(result)
  }

  const pauseGame = useCallback(() => {
    if (isPlaying && !isPaused) {
      setIsPaused(true)
    }
  }, [isPlaying, isPaused])

  const resumeGame = useCallback(() => {
    if (isPlaying && isPaused) {
      setIsPaused(false)
    }
  }, [isPlaying, isPaused])

  const resetGame = useCallback(() => {
    setCurrentRound(0)
    setTimeRemaining(ROUND_TIME)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setRoundResults([])
    setIsPlaying(false)
    setIsPaused(false)
    setGameResult(null)
    const newQuestions = generateQuestions()
    setQuestions(newQuestions)
  }, [generateQuestions])

  return {
    currentQuestion: questions[currentRound],
    currentRound: currentRound + 1,
    totalRounds,
    timeRemaining,
    score,
    streak,
    maxStreak,
    isPlaying,
    isPaused,
    gameResult,
    startRound,
    handleAnswer,
    pauseGame,
    resumeGame,
    resetGame,
  }
}
