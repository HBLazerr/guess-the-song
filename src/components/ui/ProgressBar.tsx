import { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  progress: number // 0-100
  variant?: 'primary' | 'timer'
  showLabel?: boolean
}

export default function ProgressBar({
  progress,
  variant = 'primary',
  showLabel = false,
  className,
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', {
            'bg-primary': variant === 'primary',
            'bg-gradient-to-r from-primary to-green-400': variant === 'timer',
          })}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="mt-xs text-sm text-white/70 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}
