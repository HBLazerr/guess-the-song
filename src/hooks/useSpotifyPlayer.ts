import { useState, useEffect, useCallback, useRef } from 'react'
import { getAccessToken } from '@/lib/spotify'

export function useSpotifyPlayer() {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializingRef = useRef(false)

  // Initialize Spotify Player
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      console.log('[Spotify Player] No access token available')
      return
    }

    // Prevent duplicate initialization (React StrictMode)
    if (initializingRef.current) {
      console.log('[Spotify Player] Already initializing, skipping...')
      return
    }

    const initializePlayer = () => {
      console.log('[Spotify Player] Initializing...')
      initializingRef.current = true

      const spotifyPlayer = new window.Spotify.Player({
        name: 'LZRS Player',
        getOAuthToken: (cb) => {
          const currentToken = getAccessToken()
          if (currentToken) {
            cb(currentToken)
          }
        },
        volume: 0.8,
      })

      // Ready event - device is ready to play
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('[Spotify Player] Ready with Device ID:', device_id)
        setDeviceId(device_id)
        setIsReady(true)
      })

      // Not Ready event
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('[Spotify Player] Device has gone offline:', device_id)
        setIsReady(false)
      })

      // Initialization Error
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('[Spotify Player] Initialization Error:', message)
        setError(message)
        if (message.includes('Premium')) {
          setError('Spotify Premium is required to play music.')
        }
      })

      // Authentication Error
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('[Spotify Player] Authentication Error:', message)
        setError('Authentication failed. Please sign in again.')
      })

      // Account Error
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('[Spotify Player] Account Error:', message)
        setError(message)
      })

      // Playback Error
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('[Spotify Player] Playback Error:', message)
        setError(message)
      })

      // Player State Changed
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (state) {
          setIsPlaying(!state.paused)
          console.log('[Spotify Player] State changed:', {
            paused: state.paused,
            position: state.position,
            duration: state.duration,
            track: state.track_window.current_track.name,
          })
        }
      })

      // Connect to the player
      spotifyPlayer.connect().then((success) => {
        if (success) {
          console.log('[Spotify Player] Successfully connected!')
        } else {
          console.error('[Spotify Player] Failed to connect')
          setError('Failed to connect to Spotify player')
        }
      })

      setPlayer(spotifyPlayer)
    }

    // Set up callback FIRST (before checking if SDK exists)
    // This ensures callback is ready when SDK loads
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('[Spotify Player] SDK loaded via callback!')
      initializePlayer()
    }

    // Check if SDK is already loaded
    if (window.Spotify) {
      console.log('[Spotify Player] SDK already loaded!')
      initializePlayer()
    } else {
      console.log('[Spotify Player] Waiting for SDK to load...')
    }

    // Cleanup
    return () => {
      if (player) {
        console.log('[Spotify Player] Disconnecting...')
        player.disconnect()
      }
    }
  }, []) // Empty deps - only initialize once

  // Play a track
  const playTrack = useCallback(
    async (trackId: string, startTimeMs: number = 0) => {
      if (!deviceId) {
        console.error('[Spotify Player] No device ID available')
        setError('Player not ready. Please wait...')
        return
      }

      const token = getAccessToken()
      if (!token) {
        console.error('[Spotify Player] No access token')
        setError('Not authenticated')
        return
      }

      try {
        const trackUri = `spotify:track:${trackId}`
        console.log(`[Spotify Player] Playing track ${trackUri} starting at ${startTimeMs}ms`)

        // Start playback on this device
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              uris: [trackUri],
              position_ms: startTimeMs,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[Spotify Player] Playback failed:', errorData)

          if (response.status === 404) {
            setError('Device not found. Please refresh the page.')
          } else if (response.status === 403) {
            setError('Spotify Premium is required.')
          } else {
            setError('Failed to start playback')
          }
          return
        }

        console.log('[Spotify Player] Playback started successfully')
        setError(null)
      } catch (err) {
        console.error('[Spotify Player] Error playing track:', err)
        setError('Failed to play track')
      }
    },
    [deviceId]
  )

  // Pause playback
  const pause = useCallback(() => {
    if (!player || !isReady) {
      console.log('[Spotify Player] Cannot pause - player not ready')
      return
    }
    player.pause().catch((err) => {
      // Ignore "no list loaded" errors - happens when no track is playing
      if (!err.message?.includes('Cannot perform operation')) {
        console.error('[Spotify Player] Error pausing:', err)
      }
    })
  }, [player, isReady])

  // Resume playback
  const resume = useCallback(() => {
    if (!player || !isReady) {
      console.log('[Spotify Player] Cannot resume - player not ready')
      return
    }
    player.resume().catch((err) => {
      // Ignore "no list loaded" errors - happens when no track is playing
      if (!err.message?.includes('Cannot perform operation')) {
        console.error('[Spotify Player] Error resuming:', err)
      }
    })
  }, [player, isReady])

  // Seek to position
  const seek = useCallback(
    (positionMs: number) => {
      if (!player || !isReady) {
        console.log('[Spotify Player] Cannot seek - player not ready')
        return
      }
      player.seek(positionMs).catch((err) => {
        // Ignore "no list loaded" errors - happens when no track is playing
        if (!err.message?.includes('Cannot perform operation')) {
          console.error('[Spotify Player] Error seeking:', err)
        }
      })
    },
    [player, isReady]
  )

  return {
    player,
    deviceId,
    isReady,
    isPlaying,
    error,
    playTrack,
    pause,
    resume,
    seek,
  }
}
