import { memo } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/components/lib/utils'

interface MobileMenuButtonProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onKeyDown?: (e: React.KeyboardEvent, action: () => void) => void
  isDark?: boolean
}

export const MobileMenuButton = memo(function MobileMenuButton({
  isOpen,
  onOpen,
  onClose,
  onKeyDown,
  isDark = true,
}: MobileMenuButtonProps) {
  const iconClass = isDark ? 'text-[#c6c7c6]' : 'text-gray-700'

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex h-10 w-10 cursor-pointer items-center justify-center transition-all duration-200 active:scale-90',
          isOpen ? 'hidden' : 'flex'
        )}
        onClick={onOpen}
        onKeyDown={(e) => onKeyDown?.(e, onOpen)}
        aria-label="打开菜单"
      >
        <Menu className={cn('w-5 h-5 transition-opacity duration-300 opacity-60 hover:opacity-100', iconClass)} />
      </div>

      <div
        role="button"
        tabIndex={0}
        className={cn(
          'h-10 w-10 cursor-pointer items-center justify-center transition-all duration-200 active:scale-90',
          isOpen ? 'flex' : 'hidden'
        )}
        onClick={onClose}
        onKeyDown={(e) => onKeyDown?.(e, onClose)}
        aria-label="关闭菜单"
      >
        <X className={cn('w-5 h-5 transition-opacity duration-300 opacity-60 hover:opacity-100', iconClass)} />
      </div>
    </>
  )
})