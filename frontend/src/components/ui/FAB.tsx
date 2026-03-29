'use client'

import { cn } from '@/components/lib/utils'

interface FABProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  className?: string
}

export function FAB({ onClick, icon, label, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95',
        'bg-purple-600 text-white hover:bg-purple-700',
        className
      )}
    >
      {icon}
    </button>
  )
}

export default FAB
