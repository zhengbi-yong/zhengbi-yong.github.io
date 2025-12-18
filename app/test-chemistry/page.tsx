'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { detectChemicalFormat } from '@/hooks/useChemistry'

const RDKitStructure = dynamic(() => import('@/components/chemistry/RDKitStructure'), {
  ssr: false,
  loading: () => <div>Loading RDKit...</div>,
})

export default function TestPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Test data including the problematic MOL format from the blog
  const testCases = [
    {
      name: 'Simple SMILES (Ethanol)',
      data: 'CCO',
    },
    {
      name: 'MOL Format (from blog)',
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
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Chemistry Test Page</h1>

      <div className="grid gap-12">
        {testCases.map((testCase, index) => {
          const format = detectChemicalFormat(testCase.data)
          return (
            <div key={index}>
              <h2 className="mb-4 text-xl font-semibold">
                {testCase.name}
                <span
                  className={`ml-2 rounded px-2 py-1 text-sm ${
                    format === 'unknown' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {format.toUpperCase()}
                </span>
              </h2>

              <div className="mb-4 rounded-lg border p-4">
                {mounted ? (
                  <RDKitStructure
                    data={testCase.data}
                    width={400}
                    height={300}
                    backgroundColor="white"
                    style="normal"
                  />
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Initializing chemistry viewer...
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Test Data:</h3>
                <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
                  {testCase.data}
                </pre>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
