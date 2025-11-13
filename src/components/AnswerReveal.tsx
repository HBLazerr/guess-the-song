import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Music } from 'lucide-react'
import { useMemo } from 'react'
import Card from './ui/Card'

interface AnswerRevealProps {
  show: boolean
  isCorrect: boolean
  correctAnswer: string
  trackName?: string
  artistName?: string
  albumArt?: string
}

const correctMessages = [
  "Nailed it! 🎵",
  "Perfect! 🎯",
  "You got it! ⭐",
  "Excellent! 🔥",
  "Spot on! 💯",
  "Amazing! ✨",
  "That's right! 🎉",
  "Brilliant! 🌟",
]

const incorrectMessages = [
  "Not quite! 💪",
  "Almost there! 🎵",
  "Keep trying! 🎯",
  "Nice effort! ⭐",
  "You'll get the next one! 🔥",
  "Good guess! 💫",
  "Close! ✨",
  "Don't give up! 🌟",
]

export default function AnswerReveal({
  show,
  isCorrect,
  correctAnswer,
  trackName,
  artistName,
  albumArt,
}: AnswerRevealProps) {
  // Memoize the message so it doesn't change on re-renders
  const message = useMemo(() => {
    const messages = isCorrect ? correctMessages : incorrectMessages
    return messages[Math.floor(Math.random() * messages.length)]
  }, [isCorrect, correctAnswer]) // Only change when answer changes

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-lg"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
            }}
            className="max-w-md w-full"
          >
            <Card variant="glass" className="text-center overflow-hidden">
              {/* Status Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: isCorrect ? 360 : 0 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
                className="mb-lg"
              >
                {isCorrect ? (
                  <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
                ) : (
                  <XCircle className="w-20 h-20 mx-auto text-red-500" />
                )}
              </motion.div>

              {/* Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-2xl font-bold mb-md ${
                  isCorrect ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {message}
              </motion.h2>

              {/* Correct Answer Display */}
              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-lg"
                >
                  <p className="text-sm text-white/70 mb-sm">The correct answer was:</p>
                  <div className="flex items-center justify-center gap-md">
                    {albumArt ? (
                      <motion.img
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          damping: 15,
                          stiffness: 200,
                          delay: 0.4,
                        }}
                        src={albumArt}
                        alt={correctAnswer}
                        className="w-16 h-16 rounded-md shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                        <Music className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div className="text-left">
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg font-semibold text-primary"
                      >
                        {correctAnswer}
                      </motion.p>
                      {(trackName || artistName) && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="text-sm text-white/60"
                        >
                          {trackName && artistName ? `${trackName} • ${artistName}` : trackName || artistName}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success with minimal info */}
              {isCorrect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-md mb-lg"
                >
                  {albumArt && (
                    <motion.img
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        damping: 15,
                        stiffness: 200,
                        delay: 0.4,
                      }}
                      src={albumArt}
                      alt={correctAnswer}
                      className="w-16 h-16 rounded-md shadow-lg"
                    />
                  )}
                  <p className="text-lg font-semibold text-primary">{correctAnswer}</p>
                </motion.div>
              )}

              {/* Progress Indicator */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.8, ease: "linear" }}
                className="h-1 bg-primary/30 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.8, ease: "linear" }}
                  className="h-full bg-primary origin-left"
                />
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
