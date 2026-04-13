'use client'

/**
 * BentoCard Component
 *
 * A card component for the BentoGrid layout.
 * This is a stub implementation for build compatibility.
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: ReactNode
  colSpan?: number
  rowSpan?: number
  hover3d?: boolean
  className?: string
}

export default function BentoCard({
  children,
  colSpan,
  rowSpan,
  hover3d,
  className = '',
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)]',
        hover3d && 'hover:-translate-y-1 hover:scale-[1.02]',
        className
      )}
      style={{
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
        gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      }}
    >
      {children}
    </div>
  )
}
