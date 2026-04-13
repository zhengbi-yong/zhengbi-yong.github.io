'use client'

import { useEffect, useState } from 'react'
import { initAuth } from '@/lib/store/auth-store'

/**
 * AuthInitializer - Initialize authentication on app startup
 * This component should be placed in the root layout to ensure
 * authentication state is restored from the server-backed session.
 */
export function AuthInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      return
    }

    void initAuth().finally(() => {
      setIsInitialized(true)
    })
  }, [isInitialized])

  // This component doesn't render anything
  return null
}
