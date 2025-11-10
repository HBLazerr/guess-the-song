import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded font-semibold transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Minimum touch target from UI guidelines
          'min-h-[44px] min-w-[44px]',
          // Variant styles
          {
            'bg-primary text-background hover:bg-primary/90 active:bg-primary/80':
              variant === 'primary',
            'bg-secondary text-background hover:bg-secondary/90 active:bg-secondary/80':
              variant === 'secondary',
            'bg-transparent text-white hover:bg-white/10 active:bg-white/20':
              variant === 'ghost',
          },
          // Size styles using UI guidelines spacing
          {
            'px-md py-sm text-sm': size === 'sm',
            'px-lg py-md text-base': size === 'md',
            'px-xl py-lg text-lg': size === 'lg',
          },
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
