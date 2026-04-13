'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface GeistButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const GeistButton = forwardRef<HTMLButtonElement, GeistButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          'font-geist-sans inline-flex items-center justify-center gap-2 font-medium transition-all',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          // Radius
          'rounded-lg',
          // Variants
          variant === 'primary' && [
            'bg-[var(--geist-primary)] text-[var(--geist-primary-foreground)]',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:ring-[var(--geist-ring)]',
          ],
          variant === 'secondary' && [
            'bg-[var(--geist-secondary)] text-[var(--geist-secondary-foreground)]',
            'hover:bg-[var(--geist-bg-tertiary)] active:opacity-80',
            'focus-visible:ring-[var(--geist-ring)]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-[var(--geist-fg)]',
            'hover:bg-[var(--geist-muted)] active:opacity-80',
            'focus-visible:ring-[var(--geist-ring)]',
          ],
          variant === 'destructive' && [
            'bg-[var(--geist-destructive)] text-[var(--geist-destructive-foreground)]',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:ring-[var(--geist-destructive)]',
          ],
          variant === 'outline' && [
            'border border-[var(--geist-border)] bg-transparent text-[var(--geist-fg)]',
            'hover:bg-[var(--geist-muted)] active:opacity-80',
            'focus-visible:ring-[var(--geist-ring)]',
          ],
          // Sizes
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    )
  }
)

GeistButton.displayName = 'GeistButton'

export { GeistButton }
