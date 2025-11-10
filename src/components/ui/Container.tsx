import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  centered?: boolean
}

export default function Container({
  className,
  centered = true,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full max-w-container px-lg md:px-xl',
        {
          'mx-auto': centered,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
