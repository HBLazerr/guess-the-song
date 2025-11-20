import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Zap, Home, Share2, TrendingUp, Download, Instagram, MessageCircle, X } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Container from '../ui/Container'
import { updateStatsWithGameResult, loadStats } from '@/lib/stats'
import { generateResultImage, saveImageToDevice, shareToInstagramStory, shareToInstagramDM } from '@/lib/shareUtils'
import { cn } from '@/lib/utils'
import type { GameResult } from '@/types'

export default function ResultScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result as GameResult
  const [overallStats, setOverallStats] = useState({ totalGames: 0, bestScore: 0, averageAccuracy: 0 })
  const statsUpdatedRef = useRef(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  if (!result) {
    navigate('/')
    return null
  }

  const correctAnswers = result.rounds.filter((r) => r.isCorrect).length
  const totalRounds = result.rounds.length

  // Update stats when result screen loads (only once)
  useEffect(() => {
    // Prevent duplicate updates (React Strict Mode runs effects twice)
    if (statsUpdatedRef.current) {
      console.log('[ResultScreen] Stats already updated, skipping')
      return
    }

    statsUpdatedRef.current = true
    console.log('[ResultScreen] Updating stats with game result')

    // Assume average game is ~5 minutes (we'll track properly later)
    const estimatedDuration = totalRounds * 30 // 30 seconds per round
    updateStatsWithGameResult(result, estimatedDuration)

    // Load updated stats
    const stats = loadStats()
    setOverallStats({
      totalGames: stats.totalGames,
      bestScore: stats.bestScore,
      averageAccuracy: Math.round(stats.averageAccuracy),
    })
  }, [result, totalRounds])

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

  const handleSaveImage = async () => {
    try {
      setIsGeneratingImage(true)
      const canvas = await generateResultImage({
        totalScore: result.totalScore,
        accuracy: result.accuracy,
        maxStreak: result.maxStreak,
        correctAnswers,
        totalRounds,
        mode: getModeLabel(),
      })
      await saveImageToDevice(canvas)
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error saving image:', error)
      alert('Failed to save image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleShareToInstagramStory = async () => {
    try {
      setIsGeneratingImage(true)
      const canvas = await generateResultImage({
        totalScore: result.totalScore,
        accuracy: result.accuracy,
        maxStreak: result.maxStreak,
        correctAnswers,
        totalRounds,
        mode: getModeLabel(),
      })
      await shareToInstagramStory(canvas)
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error sharing to Instagram:', error)
      alert('Failed to share to Instagram. Please try saving the image instead.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleShareToInstagramDM = () => {
    shareToInstagramDM()
    setShowShareMenu(false)
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

          {/* Overall Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-xl"
          >
            <Card variant="glass">
              <div className="flex items-center gap-sm mb-md">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Your Overall Stats</h3>
              </div>
              <div className="grid grid-cols-3 gap-md text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{overallStats.totalGames}</p>
                  <p className="text-xs text-white/70">Games Played</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{overallStats.bestScore}</p>
                  <p className="text-xs text-white/70">Best Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{overallStats.averageAccuracy}%</p>
                  <p className="text-xs text-white/70">Avg Accuracy</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-5 h-5 mr-sm" />
              Home
            </Button>
            <div className="relative">
              <Button variant="primary" onClick={() => setShowShareMenu(!showShareMenu)}>
                <Share2 className="w-5 h-5 mr-sm" />
                Share
              </Button>
              
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full right-0 mb-sm z-50"
                  >
                    <Card variant="glass" className="p-md min-w-[200px]">
                      <div className="flex items-center justify-between mb-md">
                        <h4 className="text-sm font-semibold">Share Options</h4>
                        <button
                          onClick={() => setShowShareMenu(false)}
                          className="text-white/50 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-sm">
                        <button
                          onClick={handleShare}
                          className="w-full flex items-center gap-sm p-sm rounded hover:bg-white/10 transition-colors text-left"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">Share Text</span>
                        </button>
                        <button
                          onClick={handleSaveImage}
                          disabled={isGeneratingImage}
                          className={cn(
                            "w-full flex items-center gap-sm p-sm rounded hover:bg-white/10 transition-colors text-left",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">
                            {isGeneratingImage ? 'Generating...' : 'Save Image'}
                          </span>
                        </button>
                        <button
                          onClick={handleShareToInstagramStory}
                          disabled={isGeneratingImage}
                          className={cn(
                            "w-full flex items-center gap-sm p-sm rounded hover:bg-white/10 transition-colors text-left",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <Instagram className="w-4 h-4" />
                          <span className="text-sm">
                            {isGeneratingImage ? 'Generating...' : 'Instagram Story'}
                          </span>
                        </button>
                        <button
                          onClick={handleShareToInstagramDM}
                          className="w-full flex items-center gap-sm p-sm rounded hover:bg-white/10 transition-colors text-left"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">Instagram DM</span>
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}
