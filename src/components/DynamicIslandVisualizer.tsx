import { memo } from 'react'
import { cn } from '@/lib/utils'
import SoundWave from './SoundWave'

interface DynamicIslandVisualizerProps {
  isPlaying: boolean
  className?: string
}

const DynamicIslandVisualizer = memo(function DynamicIslandVisualizer({
  isPlaying,
  className,
}: DynamicIslandVisualizerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <SoundWave isPlaying={isPlaying} bars={6} />
    </div>
  )
})

export default DynamicIslandVisualizer
