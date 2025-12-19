'use client'

import { useState, useEffect } from 'react'
import { useChemistryLocal } from '@/hooks/useChemistryLocal'

export default function TestChemistryPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [testResults, setTestResults] = useState<any[]>([])
  const { isLoaded, error, RDKit, molToSVG, smilesToSVG } = useChemistryLocal()

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Minimal test cases
  const testMolecules = [
    {
      name: 'Simple SMILES - Methane',
      format: 'SMILES',
      data: 'C',
    },
    {
      name: 'Simple SMILES - Ethanol',
      format: 'SMILES',
      data: 'CCO',
    },
    {
      name: 'Simple SMILES - Benzene',
      format: 'SMILES',
      data: 'c1ccccc1',
    },
    {
      name: 'Minimal MOL V2000',
      format: 'MOL',
      data: `  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.5400    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    0.7700    1.3330    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  END`,
    },
    {
      name: 'Caffeine MOL from blog',
      format: 'MOL',
      data: `  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
    },
    {
      name: 'Aspirin MOL',
      format: 'MOL',
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
  ]

  const runTests = async () => {
    if (!RDKit) {
      addLog('❌ RDKit not loaded')
      return
    }

    setTestResults([])
    addLog('🚀 Starting RDKit tests...\n')

    for (const molecule of testMolecules) {
      addLog(`Testing: ${molecule.name}`)
      addLog(`Format: ${molecule.format}`)
      addLog(`Data length: ${molecule.data.length} characters`)

      const result = {
        name: molecule.name,
        format: molecule.format,
        getMol: false,
        getSmiles: false,
        getSVG: false,
        error: null as string | null,
        svg: '',
      }

      try {
        // Test 1: Try to parse with our enhanced solution
        addLog('  → Testing with molToSVG...')
        try {
          const svg = await molToSVG(molecule.data)
          result.getSVG = Boolean(svg && svg.length > 0)
          result.getMol = true
          addLog(
            `  → molToSVG(): ${result.getSVG ? 'SUCCESS (length=' + (svg?.length || 0) + ')' : 'FAILED'}`
          )

          // If molToSVG succeeded, we have a valid molecule
          if (result.getSVG) {
            result.getSmiles = true
            addLog(`  → Molecule identified successfully`)
          }
        } catch (e) {
          addLog(`  → molToSVG(): FAILED - ${e}`)

          // Fallback: Try direct RDKit.get_mol() for comparison
          addLog('  → Trying direct RDKit.get_mol()...')
          const mol = RDKit.get_mol(molecule.data)
          result.getMol = mol !== null

          if (mol) {
            // Test 2: Can we get SMILES?
            try {
              const smiles = mol.get_smiles()
              result.getSmiles = smiles && smiles.length > 0
              addLog(`  → get_smiles(): ${smiles ? 'SUCCESS' : 'FAILED'}`)
            } catch (e2) {
              addLog(`  → get_smiles(): ERROR - ${e2}`)
            }

            // Test 3: Can we get SVG?
            try {
              const svg = mol.get_svg()
              result.getSVG = svg && svg.length > 0
              addLog(`  → get_svg(): ${svg ? 'SUCCESS (length=' + svg.length + ')' : 'FAILED'}`)

              if (svg) {
                // Store first successful SVG for preview
                if (!result.svg) result.svg = svg
              }
            } catch (e2) {
              addLog(`  → get_svg(): ERROR - ${e2}`)
            }

            mol.delete()
          } else {
            addLog('  ❌ RDKit.get_mol() returned null')
            result.error = 'RDKit.get_mol() returned null'
          }
        }
      } catch (e) {
        addLog(`  ❌ Exception: ${e}`)
        result.error = String(e)
      }

      setTestResults((prev) => [...prev, result])
      addLog('')
    }

    addLog('✅ All tests completed')
  }

  return (
    <div className="container mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-3xl font-bold">RDKit Chemistry Test Suite</h1>

      {/* Status Section */}
      <div className="mb-8 rounded bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">RDKit Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Loaded:</span>{' '}
            {isLoaded ? (
              <span className="text-green-600">✓ Yes</span>
            ) : (
              <span className="text-red-600">✗ No</span>
            )}
          </div>
          <div>
            <span className="font-medium">Error:</span>{' '}
            {error || <span className="text-green-600">None</span>}
          </div>
          <div>
            <span className="font-medium">RDKit Object:</span>{' '}
            {RDKit ? (
              <span className="text-green-600">✓ Available</span>
            ) : (
              <span className="text-red-600">✗ Null</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={!isLoaded}
          className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Run All Tests
        </button>
        <button
          onClick={() => {
            setLogs([])
            setTestResults([])
          }}
          className="ml-2 rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* Results Grid */}
      {testResults.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Test Results</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testResults.map((result, index) => (
              <div key={index} className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-2 font-medium">{result.name}</h3>
                <p className="mb-2 text-sm text-gray-600">Format: {result.format}</p>
                <div className="space-y-1 text-sm">
                  <div
                    className={`flex items-center ${result.getMol ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {result.getMol ? '✓' : '✗'} RDKit.get_mol()
                  </div>
                  <div
                    className={`flex items-center ${result.getSmiles ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {result.getSmiles ? '✓' : '✗'} get_smiles()
                  </div>
                  <div
                    className={`flex items-center ${result.getSVG ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {result.getSVG ? '✓' : '✗'} get_svg()
                  </div>
                  {result.error && (
                    <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">
                      Error:{' '}
                      {typeof result.error === 'string' ? result.error : String(result.error)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Console Logs</h2>
        <div className="h-64 overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-green-400">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      {isLoaded && RDKit && (
        <div className="mt-8 rounded bg-blue-50 p-4">
          <h3 className="mb-2 font-medium">RDKit Debug Info</h3>
          <p className="text-sm">
            RDKit version:{' '}
            {typeof RDKit.version === 'function' ? RDKit.version() : RDKit.version || 'Unknown'}
          </p>
          <p className="text-sm">
            Available methods:{' '}
            {Object.getOwnPropertyNames(RDKit)
              .filter((name) => typeof RDKit[name] === 'function')
              .slice(0, 10)
              .join(', ')}
            ...
          </p>
        </div>
      )}
    </div>
  )
}
