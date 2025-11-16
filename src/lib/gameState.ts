import type { Track, GameMode, SpotifyArtist, SpotifyAlbum } from '@/types'

const GAME_STATE_KEY = 'lzrs_player_game_state'

export interface SavedGameState {
  tracks: Track[]
  mode: GameMode
  artist?: SpotifyArtist
  album?: SpotifyAlbum
  timestamp: number
}

/**
 * Save game state (tracks, mode, artist/album) to localStorage
 */
export function saveGameState(state: SavedGameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving game state:', error)
  }
}

/**
 * Load saved game state from localStorage
 */
export function loadGameState(): SavedGameState | null {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY)
    if (!stored) return null
    
    const state = JSON.parse(stored) as SavedGameState
    
    // Check if state is too old (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    if (state.timestamp < oneHourAgo) {
      clearGameState()
      return null
    }
    
    return state
  } catch (error) {
    console.error('Error loading game state:', error)
    return null
  }
}

/**
 * Clear saved game state
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY)
  } catch (error) {
    console.error('Error clearing game state:', error)
  }
}

