'use client'

import { useEffect, useState } from 'react'

export function RDKitLoader() {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/rdkit-init.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log('[RDKitLoader] Script loaded')
      setStatus('loaded')
    }

    script.onerror = (e) => {
      console.error('[RDKitLoader] Script failed to load:', e)
      setStatus('error')
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  if (status === 'error') {
    return null
  }

  return null
}
