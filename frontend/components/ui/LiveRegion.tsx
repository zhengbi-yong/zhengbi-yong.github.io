'use client'

import React, { useEffect, useRef } from 'react'

interface LiveRegionProps {
  children?: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions',
  className = 'sr-only',
}: LiveRegionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && children) {
      // 更新 live region 内容
      ref.current.textContent = typeof children === 'string' ? children : ''
    }
  }, [children])

  return (
    <div
      ref={ref}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    />
  )
}

// Hook for announcements
export function useAnnouncer() {
  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const announcerId = `live-announcer-${politeness}`
    let announcer = document.getElementById(announcerId) as HTMLDivElement

    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = announcerId
      announcer.setAttribute('aria-live', politeness)
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      document.body.appendChild(announcer)
    }

    // 清空内容以重新触发
    announcer.textContent = ''

    // 使用 setTimeout 确保内容更新被检测到
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = message
      }
    }, 100)
  }

  return { announce }
}

// Status component for screen readers
export function Status({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {children}
    </div>
  )
}

// Alert component for critical announcements
export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
      {children}
    </div>
  )
}
