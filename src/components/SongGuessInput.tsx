import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SongGuessOption {
  id: string
  name: string
  imageUrl?: string
  subtitle?: string
}

interface SongGuessInputProps {
  options: SongGuessOption[]
  onSelect: (answer: string) => void
  disabled?: boolean
  className?: string
  label?: string
  answerFeedback?: {
    selectedAnswer: string
    isCorrect: boolean
  } | null
}

export default function SongGuessInput({
  options,
  onSelect,
  disabled = false,
  className,
  label = 'The song is called...',
  answerFeedback,
}: SongGuessInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return []

    const query = inputValue.toLowerCase()
    return options
      .filter((option) => {
        const nameMatch = option.name.toLowerCase().includes(query)
        const subtitleMatch = option.subtitle?.toLowerCase().includes(query)
        return nameMatch || subtitleMatch
      })
      .slice(0, 8) // Show max 8 results
  }, [options, inputValue])

  const showDropdown = isFocused && inputValue.trim().length > 0 && filteredOptions.length > 0

  // Reset on new question (when options change)
  // Note: Removed answerFeedback dependency to let key={currentRound} handle remounting
  useEffect(() => {
    setInputValue('')
    setSelectedIndex(0)
    setIsFocused(false)
  }, [options])

  // Reset selected index when filtered options change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredOptions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[selectedIndex]) {
          handleSelect(filteredOptions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (option: SongGuessOption) => {
    if (disabled) return
    setInputValue('')
    setIsFocused(false)
    onSelect(option.name)
  }

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full px-lg py-md rounded-lg text-center',
            'bg-white/10 border-2 border-white/20',
            'text-white text-xl placeholder:text-white/40',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            answerFeedback?.isCorrect && 'border-green-500 ring-2 ring-green-500 bg-green-500/10',
            answerFeedback && !answerFeedback.isCorrect && 'border-red-500 ring-2 ring-red-500 bg-red-500/10'
          )}
          placeholder={label}
          autoComplete="off"
        />

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-sm z-50 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              <div className="glass-morphic rounded-lg overflow-hidden">
                {filteredOptions.map((option, index) => (
                  <button
                    key={`song-input-${option.id}-${option.name}-${index}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-md px-md py-sm text-left transition-all',
                      'hover:bg-white/10',
                      selectedIndex === index && 'bg-white/10',
                      index !== filteredOptions.length - 1 && 'border-b border-white/10'
                    )}
                    type="button"
                  >
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-base">{option.name}</p>
                      {option.subtitle && (
                        <p className="text-sm text-white/50 truncate mt-xs">{option.subtitle}</p>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedIndex === index && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
