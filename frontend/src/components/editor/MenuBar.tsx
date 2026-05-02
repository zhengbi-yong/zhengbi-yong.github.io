'use client'

/**
 * MenuBar - Traditional software-style dropdown menu bar
 *
 * Features:
 * - Top-level menu items (File, Edit, View, etc.)
 * - Dropdown submenus with click-to-execute items
 * - Keyboard navigation support
 * - Submenu support for nested options
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface MenuItem {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  checked?: boolean
  submenu?: MenuItem[]
  action?: () => void
}

export interface MenuBarProps {
  items: MenuItem[]
  className?: string
}

export function MenuBar({ items, className }: MenuBarProps) {
  return (
    <div
      className={cn(
        'flex items-center h-8 bg-secondary dark:bg-card border-b border-border dark:border-border',
        'text-sm',
        className
      )}
    >
      {items.map((item) => (
        <MenuButton key={item.id} item={item} />
      ))}
    </div>
  )
}

function MenuButton({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback((id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setSubmenuOpen(id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setSubmenuOpen(null)
    }, 150)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSubmenuOpen(null)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  if (item.separator) {
    return <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
  }

  if (item.submenu) {
    return (
      <div
        ref={menuRef}
        className="relative"
        onMouseEnter={() => handleMouseEnter(item.id)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'px-3 h-8 flex items-center gap-1 transition-colors',
            open
              ? 'bg-gray-200 dark:bg-secondary text-foreground dark:text-white'
              : 'text-foreground dark:text-foreground hover:bg-gray-200 dark:hover:bg-secondary'
          )}
        >
          <span>{item.label}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            className={cn(
              'absolute top-full left-0 z-50',
              'min-w-[180px] py-1',
              'bg-background dark:bg-card',
              'border border-border dark:border-border',
              'shadow-lg rounded-md'
            )}
          >
            {item.submenu.map((subItem) => (
              <SubMenuItem
                key={subItem.id}
                item={subItem}
                hasSubmenu={!!subItem.submenu}
                submenuOpen={submenuOpen === subItem.id}
                onHover={() => subItem.submenu && handleMouseEnter(subItem.id)}
                onClose={() => {
                  setOpen(false)
                  setSubmenuOpen(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          if (!item.disabled) {
            item.action?.()
          }
        }}
        disabled={item.disabled}
        className={cn(
          'px-3 h-8 flex items-center gap-2 transition-colors',
          item.disabled
            ? 'text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
            : open
              ? 'bg-gray-200 dark:bg-secondary text-foreground dark:text-white'
              : 'text-foreground dark:text-foreground hover:bg-gray-200 dark:hover:bg-secondary'
        )}
      >
        {item.checked !== undefined && (
          <span className="w-4">
            {item.checked && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}
        <span>{item.label}</span>
        {item.shortcut && (
          <span className="ml-auto pl-4 text-xs text-muted-foreground dark:text-muted-foreground">
            {item.shortcut}
          </span>
        )}
      </button>
    </div>
  )
}

function SubMenuItem({
  item,
  hasSubmenu,
  submenuOpen,
  onHover,
  onClose,
}: {
  item: MenuItem
  hasSubmenu: boolean
  submenuOpen: boolean
  onHover: () => void
  onClose: () => void
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onHover()
  }, [onHover])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      // Parent handles closing
    }, 150)
  }, [])

  if (item.separator) {
    return <div className="w-full h-px bg-gray-200 dark:bg-secondary my-1" />
  }

  if (hasSubmenu) {
    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          disabled={item.disabled}
          className={cn(
            'w-full px-3 py-1.5 flex items-center gap-2 text-left transition-colors',
            item.disabled
              ? 'text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
              : 'text-foreground dark:text-foreground hover:bg-secondary dark:hover:bg-secondary'
          )}
        >
          <span className="flex-1">{item.label}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {submenuOpen && (
          <div
            className={cn(
              'absolute top-0 left-full z-50',
              'min-w-[160px] py-1',
              'bg-background dark:bg-card',
              'border border-border dark:border-border',
              'shadow-lg rounded-md'
            )}
          >
            {item.submenu?.map((subItem) => (
              <SubMenuItem
                key={subItem.id}
                item={subItem}
                hasSubmenu={!!subItem.submenu}
                submenuOpen={false}
                onHover={() => {}}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        if (!item.disabled) {
          item.action?.()
          onClose()
        }
      }}
      disabled={item.disabled}
      className={cn(
        'w-full px-3 py-1.5 flex items-center gap-2 text-left transition-colors',
        item.disabled
          ? 'text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
          : 'text-foreground dark:text-foreground hover:bg-secondary dark:hover:bg-secondary'
      )}
    >
      {item.checked !== undefined && (
        <span className="w-4">
          {item.checked && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      )}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
          {item.shortcut}
        </span>
      )}
    </button>
  )
}
