import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SoundWaveProps {
  isPlaying: boolean
  className?: string
  bars?: number
}

export default function SoundWave({ isPlaying, className, bars = 40 }: SoundWaveProps) {
  // Generate stable bar configurations once - won't change on re-renders
  const barConfigs = useMemo(() => {
    return Array.from({ length: bars }, (_, i) => ({
      delay: i * 0.05,
      duration: 0.6 + Math.random() * 0.4,
      height1: 20 + Math.random() * 60,
      height2: 20 + Math.random() * 60,
    }))
  }, [bars])

  return (
    <div className={cn('flex items-center justify-center gap-[2px] h-24', className)}>
      {barConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="bg-primary rounded-full w-1"
          initial={{ height: '8px' }}
          animate={{
            height: isPlaying
              ? [
                  '8px',
                  `${config.height1}px`,
                  '8px',
                  `${config.height2}px`,
                  '8px',
                ]
              : '8px',
          }}
          transition={{
            duration: config.duration,
            repeat: isPlaying ? Infinity : 0,
            delay: config.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
