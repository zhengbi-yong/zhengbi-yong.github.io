'use client'

import { useState, useEffect } from 'react'
import { useChemistryLocal, detectChemicalFormat } from '@/hooks/useChemistryLocal'

export default function TestChemistryDebugPage() {
  const [mounted, setMounted] = useState(false)
  const { isLoaded, error, molToSVG } = useChemistryLocal()
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const testCases = [
    {
      name: 'Simple SMILES (Ethanol)',
      data: 'CCO',
    },
    {
      name: 'MOL Format from blog',
      data: `ChemDraw07252312422D

  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
    },
    {
      name: 'Standard Caffeine SMILES',
      data: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    },
  ]

  const runTest = async () => {
    const results = []
    for (const testCase of testCases) {
      try {
        const format = detectChemicalFormat(testCase.data)
        console.log(`Testing ${testCase.name} with format: ${format}`)

        if (format === 'mol' || format === 'smiles') {
          const svg = await molToSVG(testCase.data)
          results.push({
            name: testCase.name,
            status: 'success',
            format,
            svg: svg.substring(0, 200) + '...',
          })
        } else {
          results.push({
            name: testCase.name,
            status: 'error',
            format,
            error: 'Unsupported format',
          })
        }
      } catch (err) {
        results.push({
          name: testCase.name,
          status: 'error',
          format: detectChemicalFormat(testCase.data),
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
    setTestResults(results)
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Chemistry Debug Test</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">RDKit Status</h2>
        <div className="rounded bg-gray-100 p-4">
          <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={runTest}
          disabled={!isLoaded}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          Run Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`rounded p-4 ${result.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <h3 className="font-semibold">{result.name}</h3>
                <p>Format: {result.format}</p>
                <p>Status: {result.status}</p>
                {result.error && <p className="text-red-600">Error: {result.error}</p>}
                {result.svg && (
                  <details>
                    <summary>SVG Preview</summary>
                    <pre className="mt-2 text-xs">{result.svg}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
