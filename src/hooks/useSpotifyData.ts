import { useState, useEffect } from 'react'
import { getAccessToken } from '@/lib/spotify'
import type { BrowseOption } from '@/components/BrowseSelection'
import type { GameMode } from '@/types'

/**
 * Hook to fetch and cache all user's top artists, albums, and tracks
 * Provides data for Browse selection mode
 * Supports filtering by artist/album for hierarchical navigation
 */

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY_PREFIX = 'spotify_browse_'

interface UseSpotifyDataOptions {
  artistId?: string
  albumId?: string
  fetchAlbums?: boolean // If true, fetch albums for the artist
}

interface CachedData<T> {
  data: T
  timestamp: number
}

function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key)
    if (!cached) return null

    const parsed: CachedData<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data
    }

    // Cache expired
    localStorage.removeItem(CACHE_KEY_PREFIX + key)
    return null
  } catch {
    return null
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error caching data:', error)
  }
}

export function useSpotifyData(mode: GameMode, opts: UseSpotifyDataOptions = {}) {
  const [options, setOptions] = useState<BrowseOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken()
      if (!token) {
        setError('No access token available')
        return
      }

      // Generate cache key based on mode and filters
      const cacheKey = `${mode}_${opts.artistId || ''}_${opts.albumId || ''}_${opts.fetchAlbums || ''}`
      const cached = getCachedData<BrowseOption[]>(cacheKey)
      if (cached) {
        console.log(`[useSpotifyData] Using cached data for ${cacheKey}`)
        setOptions(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        let fetchedOptions: BrowseOption[] = []

        // If fetching albums for a specific artist
        if (opts.fetchAlbums && opts.artistId) {
          fetchedOptions = await fetchArtistAlbums(token, opts.artistId)
        }
        // If fetching tracks for a specific album
        else if (opts.albumId) {
          fetchedOptions = await fetchAlbumTracksData(token, opts.albumId)
        }
        // Default mode-based fetching
        else if (mode === 'artist') {
          fetchedOptions = await fetchTopArtists(token)
        } else if (mode === 'album') {
          fetchedOptions = await fetchTopAlbums(token)
        } else if (mode === 'genre') {
          fetchedOptions = await fetchTopTracks(token)
        }

        // Cache the results
        setCachedData(cacheKey, fetchedOptions)
        setOptions(fetchedOptions)
      } catch (err) {
        console.error(`[useSpotifyData] Error fetching data:`, err)
        setError('Failed to load data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [mode, opts.artistId, opts.albumId, opts.fetchAlbums])

  return { options, isLoading, error }
}

async function fetchTopArtists(token: string): Promise<BrowseOption[]> {
  const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch top artists')
  }

  const data = await response.json()

  return data.items.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images[0]?.url || undefined,
  }))
}

async function fetchTopAlbums(token: string): Promise<BrowseOption[]> {
  // Spotify doesn't have a direct "top albums" endpoint
  // We'll fetch top tracks and extract unique albums
  const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch top tracks for albums')
  }

  const data = await response.json()

  // Extract unique albums
  const albumMap = new Map<string, BrowseOption>()

  data.items.forEach((track: any) => {
    const albumId = track.album.id
    if (!albumMap.has(albumId)) {
      albumMap.set(albumId, {
        id: albumId,
        name: track.album.name,
        imageUrl: track.album.images[0]?.url || undefined,
        subtitle: track.artists[0]?.name,
      })
    }
  })

  return Array.from(albumMap.values())
}

async function fetchTopTracks(token: string): Promise<BrowseOption[]> {
  const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch top tracks')
  }

  const data = await response.json()

  return data.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    // Don't include imageUrl for tracks - keeps the browse list clean and text-focused
    subtitle: track.artists[0]?.name,
  }))
}

async function fetchArtistAlbums(token: string, artistId: string): Promise<BrowseOption[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch artist albums')
  }

  const data = await response.json()

  return data.items.map((album: any) => ({
    id: album.id,
    name: album.name,
    imageUrl: album.images[0]?.url || undefined,
    subtitle: album.artists[0]?.name,
  }))
}

async function fetchAlbumTracksData(token: string, albumId: string): Promise<BrowseOption[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch album tracks')
  }

  const data = await response.json()

  return data.tracks.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    // Don't include imageUrl - all tracks have the same album cover (redundant)
    subtitle: track.artists[0]?.name,
  }))
}
