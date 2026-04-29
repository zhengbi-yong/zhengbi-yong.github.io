'use client'

import * as React from 'react'
import { cn } from '@/components/lib/utils'

type SidebarContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  isCollapsed: boolean
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
  isCollapsed: false,
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function SidebarProvider({
  children,
  className,
  defaultOpen = true,
}: {
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const isCollapsed = !open

  return (
    <SidebarContext.Provider value={{ open, setOpen, isCollapsed }}>
      <div className={cn('flex min-h-screen', className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  children,
  className,
  collapsible = 'icon',
  side = 'left',
}: {
  children: React.ReactNode
  className?: string
  collapsible?: 'offcanvas' | 'icon' | 'none'
  side?: 'left' | 'right'
}) {
  const { open, isCollapsed } = useSidebar()

  return (
    <aside
      data-state={isCollapsed ? 'collapsed' : 'expanded'}
      data-side={side}
      style={{ width: collapsible === 'none' ? '16rem' : open ? '16rem' : '3rem' }}
      className={cn(
        'fixed top-0 z-30 flex h-full flex-col border-r bg-background transition-[width] duration-200 ease-linear',
        side === 'right' && 'border-l border-r-0 right-0',
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarTrigger({
  className,
  children,
  onClick,
}: {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  const { setOpen, open } = useSidebar()

  return (
    <button
      type="button"
      onClick={() => {
        setOpen(!open)
        onClick?.()
      }}
      className={cn(
        '-ml-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors',
        className
      )}
      aria-label="Toggle sidebar"
    >
      {children}
    </button>
  )
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useSidebar()

  return (
    <div
      style={{ paddingLeft: open ? '16rem' : '3rem' }}
      className={cn('flex-1 flex flex-col transition-[padding-left] duration-200 ease-linear', className)}
    >
      {children}
    </div>
  )
}
