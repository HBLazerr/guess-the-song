import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Target, Zap, Home, RefreshCw, Share2 } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import type { GameResult } from '@/types'

export default function ResultScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result as GameResult

  if (!result) {
    navigate('/')
    return null
  }

  const correctAnswers = result.rounds.filter((r) => r.isCorrect).length
  const totalRounds = result.rounds.length

  const handleShare = () => {
    const text = `I scored ${result.totalScore} points on LZRS Player!\n${correctAnswers}/${totalRounds} correct with ${result.accuracy.toFixed(1)}% accuracy and a ${result.maxStreak} streak! 🎵`

    if (navigator.share) {
      navigator.share({
        title: 'LZRS Player Results',
        text,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(text)
      alert('Results copied to clipboard!')
    }
  }

  const getModeLabel = () => {
    switch (result.mode) {
      case 'artist':
        return 'Artist Mode'
      case 'album':
        return 'Album Mode'
      case 'genre':
        return 'Track Mode'
      default:
        return 'Game'
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <Container className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-2xl">
            <motion.div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Trophy className="w-12 h-12 text-primary" />
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Game Complete!
            </motion.h1>
            <motion.p
              className="text-lg text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {getModeLabel()}
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="glass" className="text-center">
                <Trophy className="w-10 h-10 text-primary mx-auto mb-md" />
                <p className="text-3xl font-bold mb-sm">{result.totalScore}</p>
                <p className="text-sm text-white/70">Total Score</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card variant="glass" className="text-center">
                <Target className="w-10 h-10 text-blue-400 mx-auto mb-md" />
                <p className="text-3xl font-bold mb-sm">
                  {correctAnswers}/{totalRounds}
                </p>
                <p className="text-sm text-white/70">
                  {result.accuracy.toFixed(1)}% Accuracy
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card variant="glass" className="text-center">
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-md" />
                <p className="text-3xl font-bold mb-sm">{result.maxStreak}</p>
                <p className="text-sm text-white/70">Max Streak</p>
              </Card>
            </motion.div>
          </div>

          {/* Round Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card variant="glass" className="mb-xl max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-md">Round Details</h3>
              <div className="space-y-sm">
                {result.rounds.map((round) => (
                  <div
                    key={round.round}
                    className="flex items-center justify-between p-sm rounded bg-white/5"
                  >
                    <div className="flex items-center gap-md flex-1">
                      <span
                        className={`text-2xl ${
                          round.isCorrect ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {round.isCorrect ? '✓' : '✗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {round.track.name}
                        </p>
                        <p className="text-xs text-white/70 truncate">
                          {round.track.artists.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">+{round.points}</p>
                      {round.streak > 0 && (
                        <p className="text-xs text-yellow-400">🔥 {round.streak}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5 mr-sm" />
              Home
            </Button>
            <Button variant="secondary" onClick={() => navigate('/game', { state: { mode: result.mode } })}>
              <RefreshCw className="w-5 h-5 mr-sm" />
              Play Again
            </Button>
            <Button variant="primary" onClick={handleShare}>
              <Share2 className="w-5 h-5 mr-sm" />
              Share
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}
