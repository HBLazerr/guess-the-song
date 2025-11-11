import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, AlertCircle, Check, X } from 'lucide-react'
import { VoiceRecognizer, isVoiceRecognitionSupported, type VoiceRecognitionError } from '@/lib/voiceRecognition'
import { findBestMatch } from '@/lib/fuzzyMatch'
import Button from './ui/Button'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  possibleAnswers: string[]
  onAnswer: (answer: string) => void
  onSwitchToBrowse: () => void
  disabled?: boolean
  className?: string
  answerFeedback?: {
    selectedAnswer: string
    isCorrect: boolean
  } | null
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error'

export default function VoiceInput({
  possibleAnswers,
  onAnswer,
  onSwitchToBrowse,
  disabled = false,
  className,
  answerFeedback,
}: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState<string>('')
  const [matchedAnswer, setMatchedAnswer] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [recognizer] = useState(() => {
    if (isVoiceRecognitionSupported()) {
      return new VoiceRecognizer({ language: 'en-US', continuous: false })
    }
    return null
  })

  const handleVoiceInput = useCallback(async () => {
    if (!recognizer || disabled) return

    try {
      setState('listening')
      setError(null)
      setTranscript('')
      setMatchedAnswer(null)

      // Listen for speech
      const spokenText = await recognizer.listen()
      setTranscript(spokenText)
      setState('processing')

      // Find best match
      const match = findBestMatch(spokenText, possibleAnswers, 0.4)

      if (match && match.confidence > 0.5) {
        // High confidence match
        setMatchedAnswer(match.match)
        setConfidence(match.confidence)
        setState('success')

        // Auto-submit after a brief delay
        setTimeout(() => {
          onAnswer(match.match)
        }, 1000)
      } else if (match && match.confidence > 0.3) {
        // Medium confidence - show for confirmation
        setMatchedAnswer(match.match)
        setConfidence(match.confidence)
        setState('idle')
      } else {
        // Low confidence or no match
        setError(`Couldn't match "${spokenText}". Try again or browse manually.`)
        setState('error')
        setTimeout(() => setState('idle'), 3000)
      }
    } catch (err) {
      const voiceError = err as VoiceRecognitionError
      console.error('Voice recognition error:', voiceError)

      let errorMessage = 'Voice recognition failed. Please try again.'

      if (voiceError.code === 'permission-denied') {
        errorMessage = 'Microphone access denied. Please allow microphone to use voice input.'
      } else if (voiceError.code === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.'
      } else if (voiceError.code === 'network-error') {
        errorMessage = 'Network error. Please check your connection.'
      }

      setError(errorMessage)
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }, [recognizer, disabled, possibleAnswers, onAnswer])

  const handleConfirm = () => {
    if (matchedAnswer) {
      onAnswer(matchedAnswer)
    }
  }

  const handleCancel = () => {
    setTranscript('')
    setMatchedAnswer(null)
    setState('idle')
  }

  // Check if voice is supported
  if (!isVoiceRecognitionSupported()) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-xl', className)}>
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-md" />
        <p className="text-center text-white/70 mb-lg">
          Voice recognition is not supported in your browser.
        </p>
        <Button onClick={onSwitchToBrowse} variant="primary">
          Browse Answers Instead
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-xl', className)}>
      {/* Main Voice Button */}
      <motion.div className="relative mb-lg">
        <motion.button
          onClick={handleVoiceInput}
          disabled={disabled || state === 'listening' || state === 'processing'}
          className={cn(
            'relative w-32 h-32 rounded-full flex items-center justify-center transition-all',
            'focus:outline-none focus:ring-4 focus:ring-primary/50',
            answerFeedback?.isCorrect && 'bg-green-500',
            answerFeedback && !answerFeedback.isCorrect && 'bg-red-500',
            !answerFeedback && state === 'listening' && 'bg-red-500',
            !answerFeedback && state === 'processing' && 'bg-yellow-500',
            !answerFeedback && state === 'success' && 'bg-green-500',
            !answerFeedback && state === 'error' && 'bg-red-600',
            !answerFeedback && state === 'idle' && 'bg-primary hover:bg-primary/90',
            (disabled || state === 'listening' || state === 'processing') && 'cursor-not-allowed opacity-50'
          )}
          animate={{
            scale: state === 'listening' ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: state === 'listening' ? Infinity : 0,
            ease: 'easeInOut',
          }}
        >
          {/* Pulsing ring while listening */}
          {state === 'listening' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Icon */}
          {answerFeedback?.isCorrect && <Check className="w-12 h-12 text-white" />}
          {answerFeedback && !answerFeedback.isCorrect && <X className="w-12 h-12 text-white" />}
          {!answerFeedback && state === 'listening' && <Mic className="w-12 h-12 text-white" />}
          {!answerFeedback && state === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Mic className="w-12 h-12 text-white" />
            </motion.div>
          )}
          {!answerFeedback && state === 'success' && <Check className="w-12 h-12 text-white" />}
          {!answerFeedback && state === 'error' && <MicOff className="w-12 h-12 text-white" />}
          {!answerFeedback && state === 'idle' && <Mic className="w-12 h-12 text-white" />}
        </motion.button>
      </motion.div>

      {/* Status Text */}
      <div className="text-center min-h-[80px] mb-md">
        <AnimatePresence mode="wait">
          {state === 'idle' && !matchedAnswer && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-lg font-semibold mb-sm">Tap to Speak</p>
              <p className="text-sm text-white/50">Say the answer out loud</p>
            </motion.div>
          )}

          {state === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-lg font-semibold text-red-400">Listening...</p>
              <p className="text-sm text-white/50">Speak now</p>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-lg font-semibold text-yellow-400">Processing...</p>
              <p className="text-sm text-white/50">Finding match</p>
            </motion.div>
          )}

          {state === 'success' && matchedAnswer && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-lg font-semibold text-green-400">Matched!</p>
              <p className="text-base text-white mt-sm">"{matchedAnswer}"</p>
            </motion.div>
          )}

          {state === 'error' && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-sm"
            >
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {answerFeedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className={cn(
                "text-lg font-semibold mb-sm",
                answerFeedback.isCorrect ? "text-green-400" : "text-red-400"
              )}>
                {answerFeedback.isCorrect ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-base text-white">"{answerFeedback.selectedAnswer}"</p>
            </motion.div>
          )}

          {state === 'idle' && matchedAnswer && transcript && !answerFeedback && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-sm text-white/70 mb-sm">
                You said: "{transcript}"
              </p>
              <p className="text-base font-semibold mb-sm">
                Did you mean: "{matchedAnswer}"?
              </p>
              <p className="text-xs text-white/50">
                {Math.round(confidence * 100)}% confidence
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-md">
        {state === 'idle' && matchedAnswer && (
          <>
            <Button onClick={handleConfirm} variant="primary" size="lg">
              Confirm
            </Button>
            <Button onClick={handleCancel} variant="ghost" size="lg">
              Try Again
            </Button>
          </>
        )}

        {(state === 'idle' || state === 'error') && !matchedAnswer && (
          <Button onClick={onSwitchToBrowse} variant="ghost" size="sm">
            Can't speak? Browse instead
          </Button>
        )}
      </div>
    </div>
  )
}
