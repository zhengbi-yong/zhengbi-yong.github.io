'use client'

import { useState, useEffect } from 'react'
import { useChemistryLocal } from '@/hooks/useChemistryLocal'

export default function TestRDKitMOLPage() {
  const [logs, setLogs] = useState<string[]>([])
  const { isLoaded, error, molToSVG } = useChemistryLocal()

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testData = {
    // 简单的苯分子
    benzene: {
      name: 'Benzene (SMILES)',
      data: 'c1ccccc1',
    },
    // 来自博客的咖啡因 MOL 数据
    caffeineMol: {
      name: 'Caffeine (MOL from blog)',
      data: `ChemDraw07252312422D

  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
    },
    // 标准 MOL 格式（无 ChemDraw 标题）
    standardMol: {
      name: 'Caffeine (Standard MOL)',
      data: `

  8  8  0  0  0  0            999 V2000
    1.3953    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    0.6982    1.2095    0.0000 N   0  0  0  0  0  0  0  0  0  0
   -0.6982    1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0
   -1.3953    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0
    2.3125    0.0000    0.0000 N   0  0  0  0  0  0  0  0  0  0
    1.5326   -1.2095    0.0000 C   0  0  0  0  0  0  0  0  0  0
    2.8321   -1.2095    0.0000 N   0  0  0  0  0  0  0  0  0  0
    3.5303    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0
    1  2  1  0  0  0  0
    2  3  1  0  0  0  0
    3  4  1  0  0  0  0
    5  6  1  0  0  0  0
    4  5  2  0  0  0 0
    6  7  1  0  0  0 0
    7  8 1  0  0  0 0
M  END`,
    },
  }

  const testMOLParsing = async (name: string, data: string) => {
    addLog(`\nTesting ${name}`)
    addLog(`Data length: ${data.length}`)
    addLog(`First 100 chars: ${data.substring(0, 100)}`)

    // 尝试不同的解析方法
    const tests = [
      { name: 'Direct parsing', data: data },
      { name: 'Trim only', data: data.trim() },
      {
        name: 'Fix ChemDraw',
        data: data.includes('ChemDraw') ? data.split('\n').slice(2).join('\n') : data,
      },
      { name: 'Standard format', data: data.replace(/ChemDraw\d+\s*/g, '').replace(/^\s*\n/, '') },
    ]

    for (const test of tests) {
      addLog(`\n${test.name}:`)
      try {
        if (typeof window !== 'undefined' && (window as any).RDKit) {
          const mol = (window as any).RDKit.get_mol(test.data)
          addLog(`  RDKit.get_mol result: ${mol ? 'SUCCESS' : 'FAILED'}`)

          if (mol) {
            const svg = mol.get_svg()
            addLog(`  get_svg: ${svg ? 'SUCCESS (length=' + svg.length + ')' : 'FAILED'}`)
            mol.delete()
            return true
          }
        } else {
          addLog(`  RDKit not available`)
        }
      } catch (err) {
        addLog(`  Error: ${err}`)
      }
    }

    return false
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">RDKit MOL Parsing Test</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">RDKit Status</h2>
        <div className="rounded bg-gray-100 p-4">
          <p>Loaded: {isLoaded ? 'Yes ✓' : 'No ✗'}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => {
            setLogs([])
            addLog('Clearing logs...\n')
          }}
          className="mr-2 rounded bg-gray-500 px-4 py-2 text-white"
        >
          Clear Logs
        </button>
        <button
          onClick={async () => {
            for (const [key, value] of Object.entries(testData)) {
              const success = await testMOLParsing(value.name, value.data)
              if (success) {
                addLog(`\n✅ ${value.name} succeeded!`)
              } else {
                addLog(`\n❌ ${value.name} failed`)
              }
            }
          }}
          disabled={!isLoaded}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
        >
          Run Tests
        </button>
      </div>

      <div className="max-h-96 overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-white">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  )
}
