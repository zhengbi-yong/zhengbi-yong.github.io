'use client'

import { useState } from 'react'
import Script from 'next/script'
import dynamic from 'next/dynamic'

// 动态导入 ChemicalStructure 组件
const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载3D结构查看器...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function Test3DmolPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  return (
    <>
      <Script
        src="/chemistry/rdkit/RDKit_minimal.js"
        strategy="beforeInteractive"
      />
      <div className="container mx-auto max-w-6xl p-8">
        <h1 className="mb-8 text-3xl font-bold">3Dmol.js 测试页面</h1>

        <div className="mb-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h2 className="mb-2 text-xl font-semibold">测试说明</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            此页面用于测试 3Dmol.js 3D 分子查看器。3Dmol 通过 npm 包动态导入，不需要外部脚本。
          </p>
        </div>

        {/* 测试 1: 基本水分子 */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">测试 1: 水分子 (PDB 文件)</h2>
          <ChemicalStructure file="/structures/water.pdb" style="stick" height={400} />
        </div>

        {/* 测试 2: 内联数据 */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">测试 2: 甲烷 (内联 XYZ 数据)</h2>
          <ChemicalStructure
            data={`5
Methane
C 0.0000 0.0000 0.0000
H 0.6291 0.6291 0.6291
H -0.6291 -0.6291 0.6291
H -0.6291 0.6291 -0.6291
H 0.6291 -0.6291 -0.6291`}
            format="xyz"
            style="sphere"
            height={400}
          />
        </div>

        {/* 测试 3: 乙醇分子 */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">测试 3: 乙醇 (内联 XYZ 数据)</h2>
          <ChemicalStructure
            data={`9
Ethanol
C 0.0000 0.0000 0.0000
C 0.0000 0.0000 1.5400
O 0.0000 1.0200 2.3000
H 0.9430 0.0000 -0.3000
H -0.4710 0.8160 -0.3000
H -0.4710 -0.8160 -0.3000
H 0.9430 0.0000 1.8400
H -0.4710 0.8160 1.8400
H -0.4710 -0.8160 1.8400`}
            format="xyz"
            style="stick"
            height={400}
          />
        </div>

        {/* 日志区域 */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">测试日志</h2>
          <div className="h-64 overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-green-400">
            {logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
