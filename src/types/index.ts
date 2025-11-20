// User types
export interface SpotifyUser {
  id: string
  name: string
  email?: string
  spotify_id: string
  profile_img?: string
  createdAt?: number
  isPremium?: boolean
}

// Game types
export type GameMode = 'artist' | 'album' | 'genre'

export type RoundSetting = 'short' | 'standard' | 'long' | 'max'
export type TimeSetting = 'quick' | 'normal' | 'relaxed'

export interface GameSettings {
  rounds: RoundSetting
  timePerRound: TimeSetting
  allowPause: boolean
}

export interface GameSession {
  sessionId: string
  userId: string
  mode: GameMode
  totalRounds: number
  score: number
  accuracy: number
  createdAt: number
}

export interface Track {
  id: string
  name: string
  artists: string[]
  album: string
  preview_url: string | null
  album_art: string
  startTime?: number // Best timestamp to start playback (in seconds)
  genres?: string[]
}

export interface QuizQuestion {
  track: Track
  options: string[]
  correctAnswer: string
  correctAnswers: string[] // All acceptable variations of the correct answer
  round: number
}

export interface RoundResult {
  round: number
  track: Track
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeRemaining: number
  points: number
  streak: number
}

export interface GameResult {
  totalScore: number
  accuracy: number
  maxStreak: number
  rounds: RoundResult[]
  mode: GameMode
}

// Spotify API types
export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: { name: string }[]
  images: { url: string }[]
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  preview_url: string | null
}

// Spotify Audio Analysis types
export interface AudioAnalysisSection {
  start: number
  duration: number
  confidence: number
  loudness: number
  tempo: number
  key: number
  mode: number
  time_signature: number
}

export interface AudioAnalysis {
  sections: AudioAnalysisSection[]
  track: {
    duration: number
    tempo: number
    loudness: number
  }
}
