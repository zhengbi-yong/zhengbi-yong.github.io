'use client'

import { cn } from '@/components/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shadcn/ui/card'

interface DataCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  contentClassName?: string
  noPadding?: boolean
}

/**
 * Unified content card for admin pages.
 * Wraps tables, charts, forms, etc. in a consistent container.
 */
export function DataCard({ title, description, children, actions, className, contentClassName, noPadding }: DataCardProps) {
  return (
    <Card className={cn('shadow-none', className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            {title && <CardTitle className="text-base font-medium">{title}</CardTitle>}
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(noPadding && 'p-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
