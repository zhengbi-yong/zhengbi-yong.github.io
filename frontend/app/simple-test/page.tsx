'use client'

import { useState, useEffect } from 'react'
import { useChemistry } from '@/hooks/useChemistry'

export default function SimpleTestPage() {
  const [mounted, setMounted] = useState(false)
  const { isLoaded, error } = useChemistry()
  const [result, setResult] = useState<string>('Loading...')

  useEffect(() => {
    setMounted(true)
    setResult(`RDKit loaded: ${isLoaded}, Error: ${error || 'None'}`)
  }, [isLoaded, error])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Simple Chemistry Test</h1>
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">useChemistry Hook Test</h2>
        <pre className="rounded bg-gray-100 p-4">{result}</pre>
      </div>
    </div>
  )
}
