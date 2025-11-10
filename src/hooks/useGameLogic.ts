import { useState, useEffect, useCallback } from 'react'
import type { Track, QuizQuestion, RoundResult, GameResult, GameMode } from '@/types'
import { shuffleArray, calculateScore } from '@/lib/utils'

const ROUND_TIME = 30 // seconds per round
const MAX_ROUNDS = 10
const MIN_ROUNDS = 5

export function useGameLogic(tracks: Track[], mode: GameMode) {
  // Calculate dynamic rounds based on available tracks
  // We need at least 4 unique tracks per question (1 correct + 3 wrong)
  // But tracks can be reused across questions, so we use a conservative estimate
  const calculateRounds = (trackCount: number): number => {
    if (trackCount < 4) return 0
    // Conservative formula: allow more rounds if we have more tracks
    const maxPossibleRounds = Math.floor(trackCount / 1.5)
    const rounds = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, maxPossibleRounds))
    console.log(`[Game Logic] ${trackCount} tracks available → ${rounds} rounds`)
    return rounds
  }

  const totalRounds = calculateRounds(tracks.length)

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

    const rounds = calculateRounds(tracks.length)
    const shuffledTracks = shuffleArray(tracks)
    const selectedTracks = shuffledTracks.slice(0, Math.min(rounds, shuffledTracks.length))

    return selectedTracks.map((track, index) => {
      // Get wrong answers
      const wrongAnswers = shuffledTracks
        .filter(t => t.id !== track.id)
        .slice(0, 3)

      let options: string[]
      let correctAnswer: string

      if (mode === 'artist') {
        correctAnswer = track.artists[0]
        options = [
          correctAnswer,
          ...wrongAnswers.map(t => t.artists[0]),
        ]
      } else if (mode === 'album') {
        correctAnswer = track.album
        options = [
          correctAnswer,
          ...wrongAnswers.map(t => t.album),
        ]
      } else {
        // genre mode - use track name
        correctAnswer = track.name
        options = [
          correctAnswer,
          ...wrongAnswers.map(t => t.name),
        ]
      }

      return {
        track,
        options: shuffleArray(options).slice(0, 4),
        correctAnswer,
        round: index + 1,
      }
    })
  }, [tracks, mode])

  // Initialize questions
  useEffect(() => {
    if (tracks.length > 0) {
      const newQuestions = generateQuestions()
      setQuestions(newQuestions)
    }
  }, [tracks, generateQuestions])

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

  const startRound = () => {
    setIsPlaying(true)
    setTimeRemaining(ROUND_TIME)
  }

  const handleAnswer = useCallback((answer: string) => {
    if (!isPlaying || currentRound >= questions.length) return

    const question = questions[currentRound]
    const isCorrect = answer === question.correctAnswer
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

    // Move to next round or finish game
    if (currentRound + 1 >= questions.length) {
      finishGame([...roundResults, result])
    } else {
      setTimeout(() => {
        setCurrentRound(prev => prev + 1)
        startRound()
      }, 1500) // Brief pause before next round
    }
  }, [currentRound, questions, isPlaying, timeRemaining, streak, maxStreak, roundResults])

  const finishGame = (results: RoundResult[]) => {
    const correctAnswers = results.filter(r => r.isCorrect).length
    const accuracy = (correctAnswers / results.length) * 100

    const result: GameResult = {
      totalScore: score,
      accuracy,
      maxStreak,
      rounds: results,
      mode,
    }

    setGameResult(result)
  }

  const pauseGame = () => {
    if (isPlaying && !isPaused) {
      setIsPaused(true)
    }
  }

  const resumeGame = () => {
    if (isPlaying && isPaused) {
      setIsPaused(false)
    }
  }

  const resetGame = () => {
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
  }

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
