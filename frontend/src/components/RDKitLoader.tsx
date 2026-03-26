'use client'

import { useEffect } from 'react'
import { loadRDKit } from '@/lib/chemistry/loadRDKit'

export function RDKitLoader() {
  useEffect(() => {
    void loadRDKit().catch(() => {
      // Rendering components surface the actual error state.
    })
  }, [])

  return null
}
