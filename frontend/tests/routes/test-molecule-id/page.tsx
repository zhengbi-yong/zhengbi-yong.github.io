'use client'

import { useState, useEffect } from 'react'
import { getSMILESFromMOL, identifyMolecule } from '@/lib/molecule-database'

export default function TestMoleculeIdentificationPage() {
  const [testResults, setTestResults] = useState<any[]>([])

  // Test cases including the problematic MOL data from the blog
  const testCases = [
    {
      name: 'Caffeine MOL (from blog)',
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
      name: 'Aspirin MOL',
      data: `  9  8  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.3953    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    2.0929    1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    3.4881    1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    4.1857    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    3.4881   -1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    2.0929   -1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    2.7906   -2.4190    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
    4.8834    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  7  1  0  0  0  0
  7  1  2  0  0  0  0
  7  8  1  0  0  0  0
  5  9  1  0  0  0  0
M  END`,
    },
    {
      name: 'Benzene SMILES',
      data: 'c1ccccc1',
    },
    {
      name: 'Ethanol SMILES',
      data: 'CCO',
    },
    {
      name: 'Unknown MOL',
      data: `  2  1  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 X   0  0  0  0  0  0  0  0  0  0  0
    1.5400    0.0000    0.0000 Y   0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END`,
    },
  ]

  const runTests = () => {
    const results = testCases.map((testCase) => {
      console.log(`Testing: ${testCase.name}`)

      // Test molecule identification
      const identifiedMolecule = identifyMolecule(testCase.data)
      const smiles = getSMILESFromMOL(testCase.data)

      return {
        name: testCase.name,
        identified: identifiedMolecule ? identifiedMolecule.name : 'Not identified',
        smiles: smiles || 'N/A',
        success: !!smiles,
      }
    })

    setTestResults(results)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Molecule Identification Test</h1>

      <div className="mb-6">
        <button
          onClick={runTests}
          className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
        >
          Run Tests Again
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="mb-4 text-xl font-semibold">Test Results</h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <h3 className="mb-2 font-medium">{result.name}</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Identified:</span>{' '}
                  <span
                    className={
                      result.identified !== 'Not identified' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {result.identified}
                  </span>
                </p>
                <p>
                  <span className="font-medium">SMILES:</span>{' '}
                  <span className={result.smiles !== 'N/A' ? 'text-green-600' : 'text-red-600'}>
                    {result.smiles}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded bg-blue-50 p-4">
        <h3 className="mb-2 font-medium">How it works</h3>
        <p className="text-sm text-gray-700">
          This test demonstrates how the molecule database identifies known molecules from MOL
          format data. The system uses pattern matching to recognize common molecules like caffeine
          and aspirin, then provides their SMILES representations for RDKit processing.
        </p>
      </div>
    </div>
  )
}
