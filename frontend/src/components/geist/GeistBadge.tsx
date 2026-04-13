'use client'

import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface GeistBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
}

function GeistBadge({ className, variant = 'default', ...props }: GeistBadgeProps) {
  return (
    <span
      className={cn(
        // Base
        'font-geist-sans inline-flex items-center rounded-full font-medium',
        'px-2.5 py-0.5 text-xs',
        // Variants
        variant === 'default' && [
          'bg-[var(--geist-primary)] text-[var(--geist-primary-foreground)]',
        ],
        variant === 'secondary' && [
          'bg-[var(--geist-secondary)] text-[var(--geist-secondary-foreground)]',
        ],
        variant === 'success' && [
          'bg-[var(--geist-success)] text-[var(--geist-success-foreground)]',
        ],
        variant === 'warning' && [
          'bg-[var(--geist-warning)] text-[var(--geist-warning-foreground)]',
        ],
        variant === 'destructive' && [
          'bg-[var(--geist-destructive)] text-[var(--geist-destructive-foreground)]',
        ],
        variant === 'outline' && [
          'border border-[var(--geist-border)] bg-transparent text-[var(--geist-fg)]',
        ],
        className
      )}
      {...props}
    />
  )
}

export { GeistBadge }
