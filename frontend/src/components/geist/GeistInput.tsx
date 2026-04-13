'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface GeistInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const GeistInput = forwardRef<HTMLInputElement, GeistInputProps>(
  ({ className, type = 'text', error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base
          'flex h-10 w-full rounded-lg border bg-transparent px-3 py-2',
          'font-geist-sans text-sm text-[var(--geist-fg)]',
          'placeholder:text-[var(--geist-muted-foreground)]',
          'transition-all duration-150',
          // Focus
          'focus:ring-2 focus:ring-offset-0 focus:outline-none',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Border & colors
          'border-[var(--geist-border)]',
          'focus:border-[var(--geist-ring)] focus:ring-[var(--geist-focus)]',
          // Error state
          error && [
            'border-[var(--geist-destructive)]',
            'focus:border-[var(--geist-destructive)] focus:ring-[var(--geist-destructive)]/20',
          ],
          className
        )}
        {...props}
      />
    )
  }
)

GeistInput.displayName = 'GeistInput'

export { GeistInput }
