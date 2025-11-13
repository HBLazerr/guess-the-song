import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import Card from './Card'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  iconColor?: string
  delay?: number
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor = 'text-primary',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card variant="glass">
        <div className="flex items-center gap-md">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-white/10 flex-shrink-0 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 mb-1">{label}</p>
            <p className="text-2xl font-bold truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/50 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
