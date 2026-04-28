'use client'

import { cn } from '@/components/lib/utils'

export function Main({
  className,
  fixed,
  fluid,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
}) {
  return (
    <main
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'px-4 py-6',
        fixed && 'flex grow flex-col overflow-hidden',
        !fluid && 'mx-auto w-full max-w-7xl',
        className
      )}
      {...props}
    />
  )
}
