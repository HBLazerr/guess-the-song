import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random string for PKCE
export function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

// Generate code challenge for PKCE
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Calculate score based on time remaining
export function calculateScore(
  isCorrect: boolean,
  timeRemaining: number,
  totalTime: number,
  currentStreak: number
): number {
  if (!isCorrect) return 0

  const basePoints = 100
  const timeBonus = (timeRemaining / totalTime) * 50
  const streakBonus = currentStreak * 10

  return Math.round(basePoints + timeBonus + streakBonus)
}

// Format time in MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Remove accents/diacritics from a string for accent-insensitive comparison
// Example: "José" → "Jose", "Estás" → "Estas", "Mí" → "Mi"
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')  // Decompose characters (é → e + combining accent)
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks
}

// Normalize track name by removing common variations
export function normalizeTrackName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[\(\[].*?(deluxe|remix|remaster|edit|version|extended|radio|acoustic|live|instrumental|explicit).*?[\)\]]/gi, '')
    .replace(/\s*-\s*(deluxe|remix|remaster|edit|version|extended|radio|acoustic|live|instrumental|explicit).*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Find the best segment to play from audio analysis
export function findBestSegment(analysis: any): number {
  if (!analysis || !analysis.sections || analysis.sections.length === 0) {
    // Fallback: start at 30 seconds to skip intro
    return 30
  }

  const sections = analysis.sections
  const trackDuration = analysis.track?.duration || 180

  // Filter out intro/outro sections
  const MIN_START = 15 // Skip first 15 seconds (likely intro)
  const MAX_START = trackDuration - 45 // Ensure we have 30+ seconds left to play

  const validSections = sections.filter(
    (section: any) => section.start >= MIN_START && section.start <= MAX_START
  )

  if (validSections.length === 0) {
    // If no valid sections, start from 25% into the song
    return Math.floor(trackDuration * 0.25)
  }

  // Find the section with highest "energy" (loudness + confidence)
  // Loudness is typically negative (closer to 0 = louder)
  // Confidence is 0-1 (higher = better)
  let bestSection = validSections[0]
  let bestScore = -Infinity

  for (const section of validSections) {
    // Normalize loudness (spotify loudness is typically -60 to 0)
    const normalizedLoudness = (section.loudness + 60) / 60 // Scale to 0-1
    const confidence = section.confidence || 0.5

    // Weight loudness more heavily than confidence
    const score = normalizedLoudness * 0.7 + confidence * 0.3

    if (score > bestScore) {
      bestScore = score
      bestSection = section
    }
  }

  console.log(`[Audio Analysis] Best segment: ${bestSection.start.toFixed(1)}s (loudness: ${bestSection.loudness.toFixed(1)}, confidence: ${bestSection.confidence.toFixed(2)})`)

  return Math.floor(bestSection.start)
}
