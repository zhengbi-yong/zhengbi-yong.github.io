import { GeistHeader } from './GeistHeader'
import { GeistFooter } from './GeistFooter'
import { cn } from '@/lib/utils'

export interface GeistLayoutProps {
  children: React.ReactNode
  className?: string
  headerClassName?: string
  footerClassName?: string
  contentClassName?: string
  hideHeader?: boolean
  hideFooter?: boolean
}

export function GeistLayout({
  children,
  className,
  headerClassName,
  footerClassName,
  contentClassName,
  hideHeader = false,
  hideFooter = false,
}: GeistLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-[var(--geist-bg)]', className)}>
      {/* Header */}
      {!hideHeader && <GeistHeader className={headerClassName} />}

      {/* Main Content */}
      <main
        className={cn('flex-1', !hideHeader && 'pt-[var(--geist-header-height)]', contentClassName)}
      >
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && <GeistFooter className={footerClassName} />}
    </div>
  )
}
