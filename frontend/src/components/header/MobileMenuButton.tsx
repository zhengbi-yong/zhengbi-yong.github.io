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
  const iconClass = isDark ? 'text-zinc-200' : 'text-zinc-700'
  const buttonClass = cn(
    'inline-flex h-10 w-10 items-center justify-center rounded-full border text-current transition-all duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.96]',
    isDark
      ? 'border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.08]'
      : 'border-black/8 bg-white/75 hover:border-black/12 hover:bg-black/[0.04]'
  )

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn(buttonClass, isOpen ? 'hidden' : 'inline-flex')}
        onClick={onOpen}
        onKeyDown={(e) => onKeyDown?.(e, onOpen)}
        aria-label="打开菜单"
      >
        <Menu className={cn('h-[18px] w-[18px] transition-transform duration-[var(--motion-fast)]', iconClass)} />
      </div>

      <div
        role="button"
        tabIndex={0}
        className={cn(buttonClass, isOpen ? 'inline-flex' : 'hidden')}
        onClick={onClose}
        onKeyDown={(e) => onKeyDown?.(e, onClose)}
        aria-label="关闭菜单"
      >
        <X className={cn('h-[18px] w-[18px] transition-transform duration-[var(--motion-fast)]', iconClass)} />
      </div>
    </>
  )
})