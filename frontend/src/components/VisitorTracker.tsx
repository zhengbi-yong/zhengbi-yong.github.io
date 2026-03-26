// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Visitor tracker.
 * Disabled by default in development because the old file-write path caused
 * Next.js dev rebuild loops on Windows.
 */
export default function VisitorTracker() {
  useEffect(() => {
    const visitorTrackingEnabled =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_VISITOR_TRACKING === 'true'

    if (!visitorTrackingEnabled) {
      return
    }

    const timer = setTimeout(() => {
      fetch('/api/visitor', {
        method: 'POST',
      }).catch((error) => {
        logger.debug('[VisitorTracker] Failed to record visitor:', error)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null
}
