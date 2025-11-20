import type { GameSettings, RoundSetting, TimeSetting } from '@/types'

const SETTINGS_STORAGE_KEY = 'lzrs_last_game_settings'

/**
 * Default game settings
 */
export const DEFAULT_SETTINGS: GameSettings = {
  rounds: 'standard',
  timePerRound: 'normal',
  allowPause: true,
}

/**
 * Round option definition for UI display
 */
export interface RoundOption {
  value: RoundSetting
  label: string
  sublabel: string
  recommended?: boolean
  roundCount: number
}

/**
 * Get available round options based on track count
 * Logic:
 * - < 7 tracks: Only "Max"
 * - 7-10 tracks: "Short", "Max"
 * - 11-15 tracks: "Short", "Standard" ⭐, "Max"
 * - 16+ tracks: "Short", "Standard" ⭐, "Long", "Max"
 */
export function getAvailableRoundOptions(trackCount: number): RoundOption[] {
  const options: RoundOption[] = []

  // Less than 7 tracks: Only show "Max"
  if (trackCount < 7) {
    options.push({
      value: 'max',
      label: 'Max',
      sublabel: `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`,
      recommended: true, // Only option, so mark as recommended
      roundCount: trackCount,
    })
    return options
  }

  // Always show "Short" if we have 7+ tracks
  options.push({
    value: 'short',
    label: 'Short',
    sublabel: '5 rounds',
    roundCount: 5,
  })

  // Show "Standard" if we have 11+ tracks
  if (trackCount >= 11) {
    options.push({
      value: 'standard',
      label: 'Standard',
      sublabel: '10 rounds',
      recommended: true,
      roundCount: 10,
    })
  }

  // Show "Long" if we have 16+ tracks
  if (trackCount >= 16) {
    options.push({
      value: 'long',
      label: 'Long',
      sublabel: '15 rounds',
      roundCount: 15,
    })
  }

  // Always show "Max"
  options.push({
    value: 'max',
    label: 'Max',
    sublabel: `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`,
    roundCount: trackCount,
  })

  return options
}

/**
 * Get default round setting based on track count
 * Prefers "Standard" when available, otherwise first available option
 */
export function getDefaultRoundSetting(trackCount: number): RoundSetting {
  if (trackCount < 7) return 'max'
  if (trackCount >= 11) return 'standard'
  return 'short'
}

/**
 * Convert time setting to seconds
 */
export function getTimeInSeconds(setting: TimeSetting): number {
  switch (setting) {
    case 'quick':
      return 10
    case 'normal':
      return 20
    case 'relaxed':
      return 30
    default:
      return 20
  }
}

/**
 * Get time setting label for UI
 */
export function getTimeLabel(setting: TimeSetting): string {
  switch (setting) {
    case 'quick':
      return 'Quick'
    case 'normal':
      return 'Normal'
    case 'relaxed':
      return 'Relaxed'
    default:
      return 'Normal'
  }
}

/**
 * Get time setting sublabel for UI
 */
export function getTimeSublabel(setting: TimeSetting): string {
  const seconds = getTimeInSeconds(setting)
  return `${seconds} seconds per round`
}

/**
 * The pause duration between rounds is always 2 seconds
 * This is separate from the allowPause setting which controls manual pausing
 */
export const PAUSE_BETWEEN_ROUNDS = 2000

/**
 * Calculate actual number of rounds based on setting and available tracks
 * Caps "max" at 30 rounds to prevent excessive games
 */
export function getRoundsCount(setting: RoundSetting, trackCount: number): number {
  switch (setting) {
    case 'short':
      return Math.min(5, trackCount)
    case 'standard':
      return Math.min(10, trackCount)
    case 'long':
      return Math.min(15, trackCount)
    case 'max':
      return Math.min(30, trackCount) // Cap at 30 for reasonable game length
    default:
      return Math.min(10, trackCount)
  }
}

/**
 * Validate and adjust settings if needed based on track count
 * Returns adjusted settings if the selected rounds option isn't available
 */
export function validateSettings(
  settings: GameSettings,
  trackCount: number
): GameSettings {
  const availableOptions = getAvailableRoundOptions(trackCount)
  const isValidOption = availableOptions.some((opt) => opt.value === settings.rounds)

  if (!isValidOption) {
    // Fall back to default for this track count
    return {
      ...settings,
      rounds: getDefaultRoundSetting(trackCount),
    }
  }

  return settings
}

/**
 * Save settings to localStorage for next time
 */
export function saveLastSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

/**
 * Load last used settings from localStorage
 * Returns null if no settings saved or error occurs
 */
export function loadLastSettings(): GameSettings | null {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) return null

    const settings = JSON.parse(stored) as GameSettings
    return settings
  } catch (error) {
    console.error('Error loading settings:', error)
    return null
  }
}

/**
 * Get settings with fallback to defaults
 * Validates settings against track count and adjusts if needed
 */
export function getSettingsOrDefault(
  settings: GameSettings | null,
  trackCount: number
): GameSettings {
  const baseSettings = settings || DEFAULT_SETTINGS
  return validateSettings(baseSettings, trackCount)
}
