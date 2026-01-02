import { memo } from 'react'
import { SunMedium, Moon } from 'lucide-react'
import { cn } from '@/components/lib/utils'

interface DarkModeToggleProps {
  isDark: boolean
  mounted: boolean
  onToggle: () => void
  variant: 'mobile' | 'desktop'
  onKeyDown?: (e: React.KeyboardEvent) => void
}

/**
 * 深色模式切换按钮组件
 * 分离为独立组件，减少 Header 重渲染
 */
export const DarkModeToggle = memo(function DarkModeToggle({
  isDark,
  mounted,
  onToggle,
  variant,
  onKeyDown,
}: DarkModeToggleProps) {
  const baseClasses =
    'flex cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-white/30 bg-white/40 backdrop-blur-sm transition-all duration-200 hover:bg-white/50 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50'

  const sizeClasses = variant === 'mobile' ? 'h-10 w-10' : 'h-9 w-9'

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(baseClasses, sizeClasses)}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      aria-label="切换深色模式"
      title={mounted ? (isDark ? 'Dark' : 'Light') : '切换深色模式'}
    >
      <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-lg bg-neutral-600 dark:bg-neutral-400">
        {mounted && (
          <>
            <SunMedium
              className={cn(
                'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                isDark ? 'hidden' : 'block'
              )}
            />
            <Moon
              className={cn(
                'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                isDark ? 'block' : 'hidden'
              )}
            />
          </>
        )}
      </div>
    </div>
  )
})
