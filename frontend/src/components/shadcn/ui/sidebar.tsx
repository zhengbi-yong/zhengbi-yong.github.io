'use client'

import * as React from 'react'
import { cn } from '@/components/lib/utils'

// Minimal sidebar provider for admin layout
const SidebarContext = React.createContext<{
  open: boolean
  setOpen: (v: boolean) => void
}>({ open: true, setOpen: () => {} })

export function SidebarProvider({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(true)
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className={cn('flex min-h-screen', className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex-1 flex flex-col', className)}>
      {children}
    </div>
  )
}
