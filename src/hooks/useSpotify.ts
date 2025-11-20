import { useState, useEffect } from 'react'
import { getAccessToken } from '@/lib/spotify'
import { shuffleArray } from '@/lib/utils'
import type { SpotifyUser, SpotifyArtist, SpotifyAlbum, SpotifyTrack, Track, GameMode } from '@/types'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export function useSpotify() {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken()
    if (!token) throw new Error('No access token available')

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`)
    }

    return response.json()
  }

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true)
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/me`)
      const isPremium = data.product === 'premium'
      const userData: SpotifyUser = {
        id: data.id,
        name: data.display_name,
        email: data.email,
        spotify_id: data.id,
        profile_img: data.images?.[0]?.url,
        createdAt: Date.now(),
        isPremium,
      }
      setUser(userData)
      return userData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const checkPremiumStatus = async (): Promise<boolean> => {
    try {
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/me`)
      return data.product === 'premium'
    } catch (err) {
      console.error('Failed to check Premium status:', err)
      return false
    }
  }

  const fetchTopArtists = async (limit = 50): Promise<SpotifyArtist[]> => {
    try {
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/me/top/artists?limit=${limit}&time_range=medium_term`)
      return data.items
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top artists')
      throw err
    }
  }

  const fetchTopTracks = async (limit = 50): Promise<SpotifyTrack[]> => {
    try {
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/me/top/tracks?limit=${limit}&time_range=medium_term`)
      return data.items
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top tracks')
      throw err
    }
  }

  const fetchArtistTopTracks = async (artistId: string): Promise<SpotifyTrack[]> => {
    try {
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=US`)
      return data.tracks
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artist tracks')
      throw err
    }
  }

  // Removed fetchAudioAnalysis - skipping for performance
  // Audio analysis added 3-5 seconds with minimal benefit
  // Using 30s default start time works well for most songs

  const fetchArtistAlbums = async (artistId: string): Promise<SpotifyAlbum[]> => {
    try {
      const data = await fetchWithToken(
        `${SPOTIFY_API_BASE}/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`
      )
      return data.items
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artist albums')
      throw err
    }
  }

  const fetchAlbumTracks = async (albumId: string, primaryArtistId?: string): Promise<SpotifyTrack[]> => {
    try {
      const data = await fetchWithToken(`${SPOTIFY_API_BASE}/albums/${albumId}/tracks?market=US`)
      // Album tracks don't include full track info, so we need to enrich them
      const album = await fetchWithToken(`${SPOTIFY_API_BASE}/albums/${albumId}`)

      return data.items
        .filter((track: any) => {
          // If primaryArtistId provided, only include tracks where artist is PRIMARY (first in array)
          if (primaryArtistId) {
            return track.artists[0]?.id === primaryArtistId
          }
          return true
        })
        .map((track: any) => ({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: {
            name: album.name,
            images: album.images,
          },
          preview_url: track.preview_url,
        }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch album tracks')
      throw err
    }
  }

  // Helper function to batch requests with delays to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const batchFetch = async <T,>(
    items: any[],
    fetchFn: (item: any) => Promise<T>,
    batchSize: number = 5,
    delayMs: number = 1000
  ): Promise<T[]> => {
    const results: T[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      console.log(`[Batch] Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`)

      try {
        const batchResults = await Promise.all(batch.map(item => fetchFn(item)))
        results.push(...batchResults)

        // Add delay between batches (except for the last batch)
        if (i + batchSize < items.length) {
          console.log(`[Batch] Waiting ${delayMs}ms before next batch...`)
          await delay(delayMs)
        }
      } catch (err) {
        console.error('[Batch] Batch failed:', err)
        // Continue with what we have so far rather than failing completely
        break
      }
    }

    return results
  }

  const getTracksForMode = async (
    mode: GameMode,
    artistId?: string,
    albumId?: string
  ): Promise<Track[]> => {
    try {
      setIsLoading(true)
      let tracks: SpotifyTrack[] = []

      console.log(`[${mode} mode] Starting track fetch...`, { artistId, albumId })

      if (mode === 'artist') {
        // Fetch fewer artists initially to avoid rate limiting
        const artists = await fetchTopArtists(50)
        console.log(`[${mode} mode] Fetched ${artists.length} top artists`)

        // Get top tracks from artists in small batches to avoid 429 errors
        const selectedArtists = artists.slice(0, 15) // Reduced from 20 to 15
        console.log(`[${mode} mode] Fetching tracks from ${selectedArtists.length} artists in batches...`)

        const trackArrays = await batchFetch(
          selectedArtists,
          (artist) => fetchArtistTopTracks(artist.id),
          5, // 5 artists per batch (increased from 3)
          100 // 100ms delay between batches (reduced from 500ms)
        )

        tracks = trackArrays.flat()
        console.log(`[${mode} mode] Fetched ${tracks.length} total tracks from artists`)
      } else if (mode === 'album' || mode === 'genre') {
        // Track Mode: Handle artist/album filtering
        if (mode === 'genre' && albumId) {
          // Specific album selected: fetch tracks from that album
          console.log(`[${mode} mode] Fetching tracks from specific album: ${albumId}`)
          tracks = await fetchAlbumTracks(albumId)
          console.log(`[${mode} mode] Fetched ${tracks.length} tracks from album`)
        } else if (mode === 'genre' && artistId) {
          // Artist selected (all albums): fetch random tracks from artist albums
          console.log(`[${mode} mode] Fetching albums from artist: ${artistId}`)
          const albums = await fetchArtistAlbums(artistId)
          console.log(`[${mode} mode] Found ${albums.length} albums, fetching tracks...`)

          // Randomize album order and fetch in parallel
          const shuffledAlbums = shuffleArray(albums)
          const MAX_TRACKS = 30
          const MAX_ALBUMS_TO_FETCH = 10 // Fetch from 10 albums in parallel

          // Fetch from multiple albums in parallel (much faster than sequential)
          const albumPromises = shuffledAlbums
            .slice(0, MAX_ALBUMS_TO_FETCH)
            .map(album =>
              fetchAlbumTracks(album.id, artistId)
                .catch(err => {
                  console.warn(`[${mode} mode] Failed to fetch album ${album.id}:`, err)
                  return [] // Return empty array on error to continue
                })
            )

          const trackArrays = await Promise.all(albumPromises)
          const allTracks = trackArrays.flat()

          // Shuffle and limit to 30 tracks
          tracks = shuffleArray(allTracks).slice(0, MAX_TRACKS)
          console.log(`[${mode} mode] Fetched ${tracks.length} randomized tracks (primary artist only) from artist albums`)
        } else {
          // Album Mode or Track Mode without selection: fetch user's top tracks
          console.log(`[${mode} mode] Fetching top tracks (2 pages)...`)
          const [page1, page2] = await Promise.all([
            fetchTopTracks(50),
            fetchWithToken(`${SPOTIFY_API_BASE}/me/top/tracks?limit=50&offset=50&time_range=medium_term`)
              .then(data => data.items)
              .catch(() => [] as SpotifyTrack[]) // Fallback if second page fails
          ])
          tracks = [...page1, ...page2]
          console.log(`[${mode} mode] Fetched ${tracks.length} top tracks`)
        }
      }

      // Debug: Log first track to see data structure
      if (tracks.length > 0) {
        console.log(`[${mode} mode] Sample track data:`, JSON.stringify(tracks[0], null, 2))
      }

      // Convert tracks to our Track type (using Web Playback SDK for playback)
      const validTracks = tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        album: track.album.name,
        preview_url: track.preview_url,
        album_art: track.album.images[0]?.url || '',
      }))

      // Deduplicate tracks by name + primary artist (handles singles, remixes, deluxe versions)
      // Skip deduplication for genre mode to allow multiple variations of the same song
      let deduplicatedTracks: typeof validTracks

      if (mode === 'genre') {
        // Genre mode: Keep ALL track variations for multiple correct answers feature
        deduplicatedTracks = validTracks
        console.log(`[${mode} mode] ✓ Skipping deduplication to preserve song variations (${validTracks.length} tracks)`)

        // Show examples of variations in the dataset
        const trackNames = validTracks.map(t => t.name).slice(0, 10)
        console.log(`[${mode} mode] First 10 track names:`, trackNames)
      } else {
        // Artist/Album mode: Deduplicate to avoid repetitive questions
        const trackMap = new Map<string, typeof validTracks[0]>()

        // Helper function to normalize track names (remove variations)
        const normalizeTrackName = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/\s*[\(\[].*?(deluxe|remix|remaster|edit|version|extended|radio|acoustic|live|instrumental|explicit).*?[\)\]]/gi, '')
            .replace(/\s*-\s*(deluxe|remix|remaster|edit|version|extended|radio|acoustic|live|instrumental|explicit).*$/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        }

        validTracks.forEach(track => {
          const normalizedName = normalizeTrackName(track.name)
          const key = `${normalizedName}-${track.artists[0].toLowerCase()}`

          const existingTrack = trackMap.get(key)

          if (!existingTrack) {
            // No track with this normalized name exists, add it
            trackMap.set(key, track)
          } else {
            // Track exists - prefer the version WITHOUT deluxe/remix/etc in the title
            const existingHasVariation = existingTrack.name.toLowerCase() !== normalizedName
            const currentHasVariation = track.name.toLowerCase() !== normalizedName

            if (existingHasVariation && !currentHasVariation) {
              // Replace with the cleaner version
              trackMap.set(key, track)
            }
            // Otherwise keep the existing one (first occurrence or cleaner version)
          }
        })
        deduplicatedTracks = Array.from(trackMap.values())

        if (validTracks.length !== deduplicatedTracks.length) {
          console.log(`[${mode} mode] Deduplicated: ${validTracks.length} → ${deduplicatedTracks.length} tracks (removed ${validTracks.length - deduplicatedTracks.length} duplicates)`)
        }
      }

      // Skip audio analysis for faster loading - use smart defaults instead
      // Audio analysis added 3-5 seconds to load time for minimal benefit
      // Default start time of 30s works well for most songs (skips intro, lands in chorus)
      const allTracks = deduplicatedTracks.map(track => ({
        ...track,
        startTime: 30 // Start at 30 seconds (good default for most songs)
      }))

      console.log(`[${mode} mode] ✓ Final tracks ready: ${allTracks.length} (using optimized defaults)`)
      return allTracks
    } catch (err) {
      console.error(`[${mode} mode] Error fetching tracks:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = getAccessToken()
    if (token && !user) {
      fetchCurrentUser()
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    fetchCurrentUser,
    fetchTopArtists,
    fetchTopTracks,
    fetchArtistAlbums,
    fetchAlbumTracks,
    getTracksForMode,
    checkPremiumStatus,
  }
}
