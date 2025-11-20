import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Music } from 'lucide-react'
import { cn, normalizeForSearch } from '@/lib/utils'
import type { GameMode } from '@/types'

export interface BrowseOption {
  id: string
  name: string
  imageUrl?: string
  subtitle?: string // For tracks: artist name
}

interface BrowseSelectionProps {
  options: BrowseOption[]
  mode: GameMode
  onSelect: (answer: string) => void
  disabled?: boolean
  className?: string
  showSearch?: boolean
  answerFeedback?: {
    selectedAnswer: string
    isCorrect: boolean
  } | null
}

export default function BrowseSelection({
  options,
  mode,
  onSelect,
  disabled = false,
  className,
  showSearch = true,
  answerFeedback,
}: BrowseSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter options based on search query (accent-insensitive, apostrophe-insensitive, punctuation-insensitive)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options

    const normalizedQuery = normalizeForSearch(searchQuery)
    return options.filter((option) => {
      const normalizedName = normalizeForSearch(option.name)
      const normalizedSubtitle = option.subtitle ? normalizeForSearch(option.subtitle) : ''
      return normalizedName.includes(normalizedQuery) || normalizedSubtitle.includes(normalizedQuery)
    })
  }, [options, searchQuery])

  const handleSelect = (option: BrowseOption) => {
    if (disabled) return
    onSelect(option.name)
  }

  const getModeLabel = () => {
    switch (mode) {
      case 'artist':
        return 'Select Artist'
      case 'album':
        return 'Select Album'
      case 'genre':
        return 'Select Song'
      default:
        return 'Select Answer'
    }
  }

  return (
    <div className={cn('flex flex-col h-full max-h-[600px]', className)}>
      {/* Header - Only show if search is enabled */}
      {showSearch && (
        <div className="mb-md">
          <div className="flex items-center gap-sm mb-md">
            <h3 className="text-lg font-semibold flex-1">{getModeLabel()}</h3>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${mode}s...`}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-lg',
                'bg-white/10 border border-white/20',
                'text-white placeholder:text-white/50',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'transition-all'
              )}
              disabled={disabled}
            />
          </div>

          {/* Results count */}
          <p className="text-xs text-white/50 mt-sm">
            {filteredOptions.length} {filteredOptions.length === 1 ? 'result' : 'results'}
          </p>
        </div>
      )}

      {/* Grid of Options */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {filteredOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <Music className="w-16 h-16 text-white/30 mb-md" />
            <p className="text-white/50">No results found</p>
            <p className="text-sm text-white/30 mt-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-md pb-md">
            {filteredOptions.map((option, index) => (
              <motion.button
                key={`browse-grid-${option.id}-${option.name}-${index}`}
                onClick={() => handleSelect(option)}
                disabled={disabled}
                className={cn(
                  'group relative flex flex-col items-center p-md rounded-lg',
                  'bg-white/5 border border-white/10',
                  'hover:bg-white/10 hover:border-primary/50',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  // Answer feedback styling
                  answerFeedback?.selectedAnswer === option.name && answerFeedback.isCorrect &&
                    'border-green-500 ring-2 ring-green-500 bg-green-500/10',
                  answerFeedback?.selectedAnswer === option.name && !answerFeedback.isCorrect &&
                    'border-red-500 ring-2 ring-red-500 bg-red-500/10'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Image - only show if imageUrl exists */}
                {option.imageUrl && (
                  <div className="relative w-full aspect-square mb-sm rounded-md overflow-hidden bg-white/5">
                    <img
                      src={option.imageUrl}
                      alt={option.name}
                      className={cn(
                        'w-full h-full object-cover',
                        'group-hover:scale-105 transition-transform duration-300'
                      )}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Name */}
                <p
                  className={cn(
                    'text-sm font-medium text-center line-clamp-2 w-full',
                    'group-hover:text-primary transition-colors'
                  )}
                >
                  {option.name}
                </p>

                {/* Subtitle (for tracks) */}
                {option.subtitle && (
                  <p className="text-xs text-white/50 text-center line-clamp-1 w-full mt-1">
                    {option.subtitle}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
