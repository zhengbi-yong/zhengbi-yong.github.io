// RDKit initialization hook backed by a shared single-flight loader.

import { useEffect, useState } from 'react'
import { loadRDKit } from '@/lib/chemistry/loadRDKit'

interface UseRDKitInitReturn {
  isLoaded: boolean
  error: string | null
  RDKit: any
}

export function useRDKitInit(): UseRDKitInitReturn {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== 'undefined' && typeof (window as any).RDKit !== 'undefined' && !!(window as any).RDKit
  )
  const [error, setError] = useState<string | null>(null)
  const [RDKit, setRDKit] = useState<any>(
    typeof window !== 'undefined' && typeof (window as any).RDKit !== 'undefined' ? (window as any).RDKit : null
  )

  useEffect(() => {
    let cancelled = false

    void loadRDKit()
      .then((instance) => {
        if (cancelled) {
          return
        }

        setRDKit(instance)
        setIsLoaded(true)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) {
          return
        }

        setError(err instanceof Error ? err.message : String(err))
        setIsLoaded(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    isLoaded,
    error,
    RDKit,
  }
}
