import { memo } from 'react'
import { cn } from '@/components/lib/utils'

interface MobileMenuButtonProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onKeyDown?: (e: React.KeyboardEvent, action: () => void) => void
}

/**
 * 移动端菜单按钮组件
 * 包含打开和关闭按钮的切换逻辑
 */
export const MobileMenuButton = memo(function MobileMenuButton({
  isOpen,
  onOpen,
  onClose,
  onKeyDown,
}: MobileMenuButtonProps) {
  return (
    <>
      {/* Hamburger Menu Button */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex h-10 w-10 cursor-pointer items-center justify-center transition-transform duration-200 active:scale-90',
          isOpen ? 'hidden' : 'flex'
        )}
        onClick={onOpen}
        onKeyDown={(e) => onKeyDown?.(e, onOpen)}
        aria-label="打开菜单"
      >
        <svg
          className="h-7 w-7 text-neutral-700 dark:text-neutral-200"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Close Menu Button */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'h-10 w-10 cursor-pointer items-center justify-center transition-transform duration-200 active:scale-90',
          isOpen ? 'flex' : 'hidden'
        )}
        onClick={onClose}
        onKeyDown={(e) => onKeyDown?.(e, onClose)}
        aria-label="关闭菜单"
      >
        <svg
          className="h-6 w-6 text-neutral-600 dark:text-neutral-200"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </>
  )
})
