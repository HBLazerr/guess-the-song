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
    .normalize('NFD')  // Decompose characters with accents
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^the\s+/i, '')
    // Normalize featuring/ft/feat variations
    .replace(/\s*\(feat\.?\s+/gi, ' feat. ')
    .replace(/\s*\(ft\.?\s+/gi, ' feat. ')
    .replace(/\s+featuring\s+/gi, ' feat. ')
    .replace(/\s+ft\.?\s+/gi, ' feat. ')
    // Normalize numbers - convert written numbers to digits
    .replace(/\bone\b/gi, '1')
    .replace(/\btwo\b/gi, '2')
    .replace(/\bthree\b/gi, '3')
    .replace(/\bfour\b/gi, '4')
    .replace(/\bfive\b/gi, '5')
    .replace(/\bsix\b/gi, '6')
    .replace(/\bseven\b/gi, '7')
    .replace(/\beight\b/gi, '8')
    .replace(/\bnine\b/gi, '9')
    .replace(/\bten\b/gi, '10')
    .replace(/\beleven\b/gi, '11')
    .replace(/\btwelve\b/gi, '12')
    .replace(/\bthirteen\b/gi, '13')
    .replace(/\bfourteen\b/gi, '14')
    .replace(/\bfifteen\b/gi, '15')
    .replace(/\bsixteen\b/gi, '16')
    .replace(/\bseventeen\b/gi, '17')
    .replace(/\beighteen\b/gi, '18')
    .replace(/\bnineteen\b/gi, '19')
    .replace(/\btwenty\b/gi, '20')
    // Common compound numbers
    .replace(/\btwenty[\s-]?one\b/gi, '21')
    .replace(/\btwenty[\s-]?two\b/gi, '22')
    .replace(/\bthirty[\s-]?three\b/gi, '33')
    .replace(/\bforty[\s-]?two\b/gi, '42')
    .replace(/\bfifty\b/gi, '50')
    .replace(/\bsixty\b/gi, '60')
    .replace(/\bseventy\b/gi, '70')
    .replace(/\beighty\b/gi, '80')
    .replace(/\bninety\b/gi, '90')
    // Remove special characters but keep spaces and numbers
    .replace(/[^\w\s]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find the best fuzzy match for a query string against a list of options
 * Returns the best match with confidence score
 *
 * @param query - Single query string OR array of alternative query strings
 * @param options - List of possible matches
 * @param threshold - Minimum match threshold (0.0-1.0)
 */
export function findBestMatch(
  query: string | string[],
  options: string[],
  threshold: number = 0.4
): FuzzyMatchResult | null {
  if (!query || !options || options.length === 0) {
    return null
  }

  // If query is an array of alternatives, process each one
  if (Array.isArray(query)) {
    return findBestMatchFromAlternatives(query, options, threshold)
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
 * Find the best match from multiple alternative transcriptions
 * Tries each alternative and returns the best overall match
 */
function findBestMatchFromAlternatives(
  alternatives: string[],
  options: string[],
  threshold: number = 0.4
): FuzzyMatchResult | null {
  if (alternatives.length === 0) {
    return null
  }

  console.log('[FuzzyMatch] Processing alternatives:', alternatives)

  let bestOverallMatch: FuzzyMatchResult | null = null
  let bestConfidence = 0

  // Try each alternative
  for (const alt of alternatives) {
    const result = findBestMatch(alt, options, threshold)

    if (result && result.confidence > bestConfidence) {
      bestConfidence = result.confidence
      bestOverallMatch = result
      console.log(`[FuzzyMatch] Better match found with "${alt}":`, result.match, `(${Math.round(result.confidence * 100)}%)`)
    }
  }

  if (bestOverallMatch) {
    console.log('[FuzzyMatch] Best overall match:', bestOverallMatch.match, `(${Math.round(bestOverallMatch.confidence * 100)}%)`)
  } else {
    console.log('[FuzzyMatch] No match found from alternatives')
  }

  return bestOverallMatch
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
