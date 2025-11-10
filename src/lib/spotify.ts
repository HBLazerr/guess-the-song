import { generateRandomString, generateCodeChallenge } from './utils'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback'
const SCOPES = [
  'user-top-read',
  'user-read-playback-position',
  'streaming',
  'user-read-email',
  'user-read-private',
].join(' ')

export async function redirectToSpotifyAuth() {
  if (!CLIENT_ID) {
    throw new Error('Spotify Client ID not configured. Please check your .env file.')
  }

  console.log('Starting Spotify authorization...')
  console.log('Redirect URI:', REDIRECT_URI)

  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store code verifier for later use
  localStorage.setItem('spotify_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function handleSpotifyCallback(code: string): Promise<string> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier')

  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please try logging in again.')
  }

  console.log('Exchanging code for access token...')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Token exchange failed:', errorData)
    throw new Error(`Failed to exchange code for token: ${errorData.error_description || response.statusText}`)
  }

  const data = await response.json()
  const accessToken = data.access_token
  const expiresIn = data.expires_in

  if (!accessToken) {
    throw new Error('No access token received from Spotify')
  }

  console.log('Access token received, expires in:', expiresIn, 'seconds')

  // Store token and expiry
  localStorage.setItem('spotify_access_token', accessToken)
  localStorage.setItem('spotify_token_expiry', (Date.now() + expiresIn * 1000).toString())
  localStorage.removeItem('spotify_code_verifier')

  return accessToken
}

export function getAccessToken(): string | null {
  const token = localStorage.getItem('spotify_access_token')
  const expiry = localStorage.getItem('spotify_token_expiry')

  if (!token || !expiry) return null

  if (Date.now() >= parseInt(expiry)) {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_token_expiry')
    return null
  }

  return token
}

export function logout() {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_token_expiry')
  localStorage.removeItem('spotify_code_verifier')
  window.location.href = '/login'
}
