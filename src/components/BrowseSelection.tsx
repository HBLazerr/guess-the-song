import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Music, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  // Hierarchical navigation props
  hierarchical?: {
    showingAlbums: boolean
    selectedAlbum?: BrowseOption
    onAlbumSelect?: (album: BrowseOption) => void
    onBack?: () => void
  }
}

export default function BrowseSelection({
  options,
  mode,
  onSelect,
  disabled = false,
  className,
  hierarchical,
}: BrowseSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options

    const query = searchQuery.toLowerCase()
    return options.filter((option) => {
      const nameMatch = option.name.toLowerCase().includes(query)
      const subtitleMatch = option.subtitle?.toLowerCase().includes(query)
      return nameMatch || subtitleMatch
    })
  }, [options, searchQuery])

  const handleSelect = (option: BrowseOption) => {
    if (disabled) return

    // If in hierarchical mode and showing albums, navigate to tracks instead of selecting
    if (hierarchical?.showingAlbums && hierarchical.onAlbumSelect) {
      hierarchical.onAlbumSelect(option)
      return
    }

    // Otherwise, select the option as the answer
    setSelectedId(option.id)
    // Brief delay for visual feedback
    setTimeout(() => {
      onSelect(option.name)
    }, 300)
  }

  const getModeLabel = () => {
    // If hierarchical navigation, show appropriate label
    if (hierarchical?.showingAlbums) {
      return 'Select Album'
    }
    if (hierarchical?.selectedAlbum) {
      return `Select Track from "${hierarchical.selectedAlbum.name}"`
    }

    // Default labels
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
      {/* Header with Search */}
      <div className="mb-md">
        <div className="flex items-center gap-sm mb-md">
          {/* Back button for hierarchical navigation */}
          {hierarchical?.selectedAlbum && hierarchical.onBack && (
            <button
              onClick={hierarchical.onBack}
              className="flex items-center gap-xs px-sm py-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
              disabled={disabled}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">Back to Albums</span>
            </button>
          )}
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
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={disabled}
                className={cn(
                  'group relative flex flex-col items-center p-md rounded-lg',
                  'bg-white/5 border border-white/10',
                  'hover:bg-white/10 hover:border-primary/50',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedId === option.id && 'ring-2 ring-green-500 bg-green-500/20'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Image */}
                <div className="relative w-full aspect-square mb-sm rounded-md overflow-hidden bg-white/5">
                  {option.imageUrl ? (
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Selection indicator */}
                  {selectedId === option.id && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </div>

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
