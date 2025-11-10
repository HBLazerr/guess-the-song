/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_SPOTIFY_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Spotify Web Playback SDK Types
interface Window {
  onSpotifyWebPlaybackSDKReady: () => void
  Spotify: typeof Spotify
}

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: string, callback: (data: any) => void): void
    removeListener(event: string, callback?: (data: any) => void): void
    getCurrentState(): Promise<PlayerState | null>
    setName(name: string): Promise<void>
    getVolume(): Promise<number>
    setVolume(volume: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    togglePlay(): Promise<void>
    seek(position_ms: number): Promise<void>
    previousTrack(): Promise<void>
    nextTrack(): Promise<void>
    activateElement(): Promise<void>
  }

  interface PlayerState {
    context: {
      uri: string | null
      metadata: any
    }
    disallows: {
      pausing: boolean
      peeking_next: boolean
      peeking_prev: boolean
      resuming: boolean
      seeking: boolean
      skipping_next: boolean
      skipping_prev: boolean
    }
    paused: boolean
    position: number
    repeat_mode: number
    shuffle: boolean
    track_window: {
      current_track: Track
      previous_tracks: Track[]
      next_tracks: Track[]
    }
    duration: number
  }

  interface Track {
    uri: string
    id: string | null
    type: string
    media_type: string
    name: string
    is_playable: boolean
    album: {
      uri: string
      name: string
      images: Array<{ url: string }>
    }
    artists: Array<{ uri: string; name: string }>
  }

  interface Error {
    message: string
  }

  interface PlayerInit {
    name: string
    getOAuthToken(cb: (token: string) => void): void
    volume?: number
  }

  const Player: {
    new (options: PlayerInit): Player
  }
}
