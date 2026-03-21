'use client'

import { useState, useEffect, ReactNode, Fragment } from 'react'

/**
 * ClientOnly wrapper - ensures content only renders on client side
 * Use this to prevent SSR errors for components that need browser APIs
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <Fragment>{fallback}</Fragment>
  }

  return <Fragment>{children}</Fragment>
}
