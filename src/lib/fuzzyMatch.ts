import Fuse from 'fuse.js'

/**
 * Fuzzy matching utility for song, artist, and album names
 * Handles typos, different formats, and partial matches
 */

export interface FuzzyMatchResult {
  match: string
  confidence: number
  index: number
}

/**
 * Normalize a string for comparison
 * Handles common variations in artist/song names
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^the\s+/i, '')
    // Normalize featuring/ft/feat
    .replace(/\s*\(feat\.?\s+/gi, ' feat. ')
    .replace(/\s*\(ft\.?\s+/gi, ' feat. ')
    .replace(/\s+featuring\s+/gi, ' feat. ')
    // Remove special characters but keep spaces
    .replace(/[^\w\s]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find the best fuzzy match for a query string against a list of options
 * Returns the best match with confidence score
 */
export function findBestMatch(
  query: string,
  options: string[],
  threshold: number = 0.4
): FuzzyMatchResult | null {
  if (!query || !options || options.length === 0) {
    return null
  }

  // Normalize query
  const normalizedQuery = normalizeString(query)

  // Check for exact match first (case-insensitive)
  const exactMatchIndex = options.findIndex(
    (opt) => normalizeString(opt) === normalizedQuery
  )
  if (exactMatchIndex !== -1) {
    return {
      match: options[exactMatchIndex],
      confidence: 1.0,
      index: exactMatchIndex,
    }
  }

  // Configure Fuse.js for fuzzy matching
  const fuse = new Fuse(options, {
    includeScore: true,
    threshold: threshold, // 0.0 = perfect match, 1.0 = match anything
    keys: ['$'], // Search the entire string
    ignoreLocation: true, // Don't penalize matches far from start
    minMatchCharLength: 2,
  })

  // Perform fuzzy search
  const results = fuse.search(normalizedQuery)

  if (results.length === 0) {
    return null
  }

  // Get the best result
  const bestResult = results[0]
  const confidence = 1 - (bestResult.score || 1) // Convert score to confidence (0-1)

  return {
    match: bestResult.item,
    confidence,
    index: options.indexOf(bestResult.item),
  }
}

/**
 * Check if a query matches a specific target string
 * Used for validating answers
 */
export function isMatch(
  query: string,
  target: string,
  threshold: number = 0.3
): boolean {
  const result = findBestMatch(query, [target], threshold)
  return result !== null && result.confidence >= (1 - threshold)
}

/**
 * Get multiple potential matches above a confidence threshold
 * Useful for showing suggestions
 */
export function getTopMatches(
  query: string,
  options: string[],
  maxResults: number = 5,
  minConfidence: number = 0.5
): FuzzyMatchResult[] {
  if (!query || !options || options.length === 0) {
    return []
  }

  const normalizedQuery = normalizeString(query)

  const fuse = new Fuse(options, {
    includeScore: true,
    threshold: 1 - minConfidence,
    keys: ['$'],
    ignoreLocation: true,
    minMatchCharLength: 2,
  })

  const results = fuse.search(normalizedQuery)

  return results
    .slice(0, maxResults)
    .map((result) => ({
      match: result.item,
      confidence: 1 - (result.score || 1),
      index: options.indexOf(result.item),
    }))
    .filter((result) => result.confidence >= minConfidence)
}
