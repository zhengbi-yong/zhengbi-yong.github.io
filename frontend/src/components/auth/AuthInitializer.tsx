'use client'

import { useEffect, useState } from 'react'
import { initAuth } from '@/lib/store/auth-store'

/**
 * AuthInitializer - Initialize authentication on app startup
 * This component should be placed in the root layout to ensure
 * authentication state is restored from localStorage on app load.
 */
export function AuthInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      // Initialize auth from localStorage
      initAuth()
      setIsInitialized(true)
    }
  }, [isInitialized])

  // This component doesn't render anything
  return null
}
