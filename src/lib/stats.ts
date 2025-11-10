import type { GameResult, GameMode } from '@/types'

/**
 * Statistics management using localStorage
 * Stores and calculates aggregate game statistics
 */

const STATS_KEY = 'lzrs_player_stats'
const GAME_HISTORY_KEY = 'lzrs_player_game_history'
const MAX_HISTORY_SIZE = 50

export interface PlayerStats {
  totalGames: number
  totalScore: number
  bestScore: number
  averageAccuracy: number
  totalCorrect: number
  totalQuestions: number
  currentStreak: number
  maxStreak: number
  favoriteMode: GameMode | null
  totalPlayTimeMinutes: number
  lastPlayedDate: string | null
  modeStats: Record<GameMode, ModeStats>
}

export interface ModeStats {
  gamesPlayed: number
  totalScore: number
  bestScore: number
  averageAccuracy: number
}

export interface GameHistoryEntry {
  id: string
  date: string
  mode: GameMode
  score: number
  accuracy: number
  maxStreak: number
  rounds: number
  duration: number // seconds
}

/**
 * Get initial/default stats
 */
function getDefaultStats(): PlayerStats {
  return {
    totalGames: 0,
    totalScore: 0,
    bestScore: 0,
    averageAccuracy: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    currentStreak: 0,
    maxStreak: 0,
    favoriteMode: null,
    totalPlayTimeMinutes: 0,
    lastPlayedDate: null,
    modeStats: {
      artist: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageAccuracy: 0 },
      album: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageAccuracy: 0 },
      genre: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageAccuracy: 0 },
    },
  }
}

/**
 * Load stats from localStorage
 */
export function loadStats(): PlayerStats {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (!stored) {
      return getDefaultStats()
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading stats:', error)
    return getDefaultStats()
  }
}

/**
 * Save stats to localStorage
 */
function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Error saving stats:', error)
  }
}

/**
 * Load game history from localStorage
 */
export function loadGameHistory(): GameHistoryEntry[] {
  try {
    const stored = localStorage.getItem(GAME_HISTORY_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading game history:', error)
    return []
  }
}

/**
 * Save game history to localStorage
 */
function saveGameHistory(history: GameHistoryEntry[]): void {
  try {
    // Keep only the most recent games
    const trimmed = history.slice(-MAX_HISTORY_SIZE)
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Error saving game history:', error)
  }
}

/**
 * Calculate if the user played today (for streak tracking)
 */
function isPlayedToday(lastPlayedDate: string | null): boolean {
  if (!lastPlayedDate) return false

  const today = new Date().toDateString()
  const lastPlayed = new Date(lastPlayedDate).toDateString()
  return today === lastPlayed
}

/**
 * Calculate if last played was yesterday (for streak tracking)
 */
function wasPlayedYesterday(lastPlayedDate: string | null): boolean {
  if (!lastPlayedDate) return false

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  const lastPlayed = new Date(lastPlayedDate).toDateString()
  return yesterdayStr === lastPlayed
}

/**
 * Update stats after a game completes
 */
export function updateStatsWithGameResult(result: GameResult, durationSeconds: number): void {
  const stats = loadStats()
  const history = loadGameHistory()

  // Calculate correct answers
  const correctAnswers = result.rounds.filter(r => r.isCorrect).length
  const totalQuestions = result.rounds.length

  // Update overall stats
  stats.totalGames += 1
  stats.totalScore += result.totalScore
  stats.bestScore = Math.max(stats.bestScore, result.totalScore)
  stats.totalCorrect += correctAnswers
  stats.totalQuestions += totalQuestions
  stats.averageAccuracy = (stats.totalCorrect / stats.totalQuestions) * 100
  stats.maxStreak = Math.max(stats.maxStreak, result.maxStreak)
  stats.totalPlayTimeMinutes += Math.round(durationSeconds / 60)

  // Update daily streak
  const today = new Date().toISOString()
  if (stats.lastPlayedDate === null) {
    stats.currentStreak = 1
  } else if (isPlayedToday(stats.lastPlayedDate)) {
    // Already played today, don't increment streak
  } else if (wasPlayedYesterday(stats.lastPlayedDate)) {
    stats.currentStreak += 1
  } else {
    // Streak broken
    stats.currentStreak = 1
  }
  stats.lastPlayedDate = today

  // Update mode-specific stats
  const modeStats = stats.modeStats[result.mode]
  modeStats.gamesPlayed += 1
  modeStats.totalScore += result.totalScore
  modeStats.bestScore = Math.max(modeStats.bestScore, result.totalScore)
  modeStats.averageAccuracy =
    ((modeStats.averageAccuracy * (modeStats.gamesPlayed - 1)) + result.accuracy) / modeStats.gamesPlayed

  // Determine favorite mode
  const modes: GameMode[] = ['artist', 'album', 'genre']
  stats.favoriteMode = modes.reduce((prev, curr) =>
    stats.modeStats[curr].gamesPlayed > stats.modeStats[prev].gamesPlayed ? curr : prev
  )

  // Add to game history
  const historyEntry: GameHistoryEntry = {
    id: `${Date.now()}-${Math.random()}`,
    date: today,
    mode: result.mode,
    score: result.totalScore,
    accuracy: result.accuracy,
    maxStreak: result.maxStreak,
    rounds: totalQuestions,
    duration: durationSeconds,
  }
  history.push(historyEntry)

  // Save everything
  saveStats(stats)
  saveGameHistory(history)
}

/**
 * Reset all stats (for testing or user request)
 */
export function resetStats(): void {
  localStorage.removeItem(STATS_KEY)
  localStorage.removeItem(GAME_HISTORY_KEY)
}

/**
 * Get formatted stats for display
 */
export function getFormattedStats(): {
  gamesPlayed: string
  averageAccuracy: string
  bestScore: string
  currentStreak: string
  favoriteMode: string
  totalPlayTime: string
} {
  const stats = loadStats()

  return {
    gamesPlayed: stats.totalGames.toString(),
    averageAccuracy: stats.totalQuestions > 0 ? `${Math.round(stats.averageAccuracy)}%` : '0%',
    bestScore: stats.bestScore.toString(),
    currentStreak: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`,
    favoriteMode: stats.favoriteMode
      ? stats.favoriteMode.charAt(0).toUpperCase() + stats.favoriteMode.slice(1)
      : 'None',
    totalPlayTime: `${stats.totalPlayTimeMinutes} min`,
  }
}
