import { useState, useEffect, useCallback, useRef } from 'react'
import { getAccessToken } from '@/lib/spotify'

export function useSpotifyPlayer() {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializingRef = useRef(false)
  const playerRef = useRef<Spotify.Player | null>(null)

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
        // Ignore "Cannot perform operation" errors - these happen during normal operation
        // when pause/resume is called before a track is loaded
        if (message.includes('Cannot perform operation')) {
          console.log('[Spotify Player] Ignoring expected playback error:', message)
          return
        }
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
      playerRef.current = spotifyPlayer
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
      console.log('[Spotify Player] Cleanup starting...')

      // In development mode with React Strict Mode, components mount/unmount twice
      // We don't want to disconnect the player during these test cleanups
      const isDevMode = import.meta.env.DEV

      if (isDevMode) {
        console.log('[Spotify Player] Dev mode - skipping disconnect to prevent Strict Mode issues')
        // Don't disconnect or reset in dev mode - just log
        // The player will persist across strict mode mount/unmount cycles
        return
      }

      // Production cleanup - disconnect player using ref (not closure variable)
      if (playerRef.current) {
        console.log('[Spotify Player] Disconnecting player (production cleanup)...')
        playerRef.current.disconnect()
        playerRef.current = null
      }

      // Reset initialization flag to allow reinitialization
      initializingRef.current = false

      // Clear global callback to prevent conflicts
      if (window.onSpotifyWebPlaybackSDKReady) {
        window.onSpotifyWebPlaybackSDKReady = null
      }

      // Reset all state
      setPlayer(null)
      setDeviceId(null)
      setIsReady(false)
      setIsPlaying(false)
      setError(null)

      console.log('[Spotify Player] Cleanup complete')
    }
  }, []) // Empty deps - only initialize once

  // Validate device is registered with Spotify (used for retry logic only)
  const validateDevice = useCallback(async (): Promise<boolean> => {
    if (!deviceId) return false

    const token = getAccessToken()
    if (!token) {
      console.log('[Spotify Player] No access token available for validation')
      return false
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        console.log('[Spotify Player] Device validation failed:', response.status, response.statusText)
        return false
      }

      const data = await response.json()
      const device = data.devices.find((d: any) => d.id === deviceId)

      if (!device) {
        console.log('[Spotify Player] Device not found in devices list')
        return false
      }

      console.log('[Spotify Player] Device validated:', device.name, 'Active:', device.is_active)
      return true
    } catch (err) {
      console.log('[Spotify Player] Error validating device:', err)
      return false
    }
  }, [deviceId])

  // Play a track
  const playTrack = useCallback(
    async (trackId: string, startTimeMs: number = 0, retryCount: number = 0) => {
      if (!deviceId) {
        console.error('[Spotify Player] No device ID available')
        setError('Player not ready. Please wait...')
        return
      }

      const token = getAccessToken()
      if (!token) {
        console.error('[Spotify Player] No access token')
        setError('Session expired. Please refresh the page and sign in again.')
        return
      }

      try {
        const trackUri = `spotify:track:${trackId}`
        console.log(`[Spotify Player] Playing track ${trackUri} starting at ${startTimeMs}ms (attempt ${retryCount + 1})`)

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

          // Handle 401 Unauthorized - token expired
          if (response.status === 401) {
            console.error('[Spotify Player] Token expired (401)')
            setError('Session expired. Please refresh the page and sign in again.')
            return
          }

          // Handle 404 - Device not found, retry with validation
          if (response.status === 404 && retryCount < 2) {
            console.log('[Spotify Player] Device not found, validating and retrying...')
            await new Promise(resolve => setTimeout(resolve, 2000))

            const isValid = await validateDevice()
            if (isValid) {
              return playTrack(trackId, startTimeMs, retryCount + 1)
            } else {
              setError('Device not found. Please refresh the page.')
              return
            }
          } else if (response.status === 404) {
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
    [deviceId, validateDevice]
  )

  // Pause playback
  const pause = useCallback(() => {
    if (!player || !isReady) {
      console.log('[Spotify Player] Cannot pause - player not ready')
      return
    }
    player.pause().catch((err) => {
      // Silently ignore "no list loaded" errors - happens when no track is playing
      if (!err.message?.includes('Cannot perform operation')) {
        console.error('[Spotify Player] Error pausing:', err)
      }
      // Otherwise suppress the error completely
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
