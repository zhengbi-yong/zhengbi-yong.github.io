'use client'

import { cn } from '@/components/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-primary/10 text-primary dark:text-primary',
  danger: 'bg-destructive/50/10 text-destructive dark:text-destructive',
  info: 'bg-primary/10 text-primary dark:text-primary',
  muted: 'bg-muted text-muted-foreground',
}

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

/**
 * Unified status badge for admin pages.
 * Replaces hand-rolled inline badge spans across all pages.
 */
export function StatusBadge({ children, variant = 'default', className, dot }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'success' && 'bg-emerald-500',
          variant === 'warning' && 'bg-primary',
          variant === 'danger' && 'bg-destructive/50',
          variant === 'info' && 'bg-primary',
          variant === 'muted' && 'bg-muted-foreground',
          variant === 'default' && 'bg-primary',
        )} />
      )}
      {children}
    </span>
  )
}
