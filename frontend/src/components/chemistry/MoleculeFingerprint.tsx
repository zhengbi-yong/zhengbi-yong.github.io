'use client'

import { useState, useEffect } from 'react'
import { useChemistryLocal, detectChemicalFormat } from '@/lib/hooks/useChemistryLocal'

interface MoleculeFingerprintProps {
  data: string
  type?: 'morgan' | 'maccs' | 'rdkit'
  radius?: number
  bits?: number
  showDetails?: boolean
  className?: string
}

/**
 * MoleculeFingerprint - 分子指纹展示组件
 * 基于 RDKit.js 生成和展示分子指纹
 */
export default function MoleculeFingerprint({
  data,
  // Prefixing with underscore to acknowledge unused prop in this component
  _type = 'morgan',
  radius = 2,
  bits = 2048,
  showDetails = true,
  className = '',
}: MoleculeFingerprintProps & { _type?: 'morgan' | 'maccs' | 'rdkit' }) {
  // acknowledge unused prop to satisfy TS6133
  void _type
  const [fingerprint, setFingerprint] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [bitCount, setBitCount] = useState<number>(0)

  const { isLoaded, error: rdkitError, getMorganFingerprint } = useChemistryLocal()

  useEffect(() => {
    const generateFingerprint = async () => {
      if (!data.trim()) {
        setError('No chemical data provided')
        setIsLoading(false)
        return
      }

      if (!isLoaded) {
        return
      }

      try {
        setIsLoading(true)
        setError('')

        const format = detectChemicalFormat(data)
        if (!format || format === 'unknown') {
          throw new Error('Unable to detect chemical data format')
        }

        const fp = await getMorganFingerprint(data, radius, bits)
        setFingerprint(fp)

        // 计算1的位数
        const ones = (fp.match(/1/g) || []).length
        setBitCount(ones)
        setError('')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate fingerprint'
        setError(errorMessage)
        setFingerprint('')
        setBitCount(0)
        console.error('Fingerprint generation error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    generateFingerprint()
  }, [data, isLoaded, getMorganFingerprint, radius, bits])

  const getBitDensity = () => {
    if (!fingerprint) return 0
    return ((bitCount / fingerprint.length) * 100).toFixed(1)
  }

  if (rdkitError) {
    return (
      <div className={`rounded-lg border border-red-300 p-4 ${className}`}>
        <div className="text-sm text-red-500">⚠️ Chemistry Engine Error</div>
        <div className="mt-1 text-xs text-gray-600">{rdkitError}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-sm text-gray-600">Generating fingerprint...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 p-4 ${className}`}>
        <div className="text-sm text-red-500">❌ Fingerprint Error</div>
        <div className="mt-1 text-xs text-gray-600">{error}</div>
      </div>
    )
  }

  if (!showDetails) {
    return (
      <div className={`rounded bg-gray-50 p-2 font-mono text-xs break-all ${className}`}>
        {fingerprint}
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="grid grid-cols-1 gap-4">
        {/* 基本信息 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Morgan Fingerprint</span>
            <span className="ml-2 text-sm text-gray-500">
              (radius: {radius}, bits: {bits})
            </span>
          </div>
          <div className="text-sm text-gray-600">Bit Density: {getBitDensity()}%</div>
        </div>

        {/* 指纹可视化 */}
        <div className="rounded bg-gray-50 p-3">
          <div className="font-mono text-xs leading-relaxed break-all">
            {fingerprint.split('').map((bit, index) => (
              <span
                key={index}
                className={`${bit === '1' ? 'font-semibold text-green-600' : 'text-gray-400'}`}
              >
                {bit}
              </span>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{bitCount}</div>
            <div className="text-xs text-gray-500">Set Bits</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{fingerprint.length - bitCount}</div>
            <div className="text-xs text-gray-500">Unset Bits</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{fingerprint.length}</div>
            <div className="text-xs text-gray-500">Total Bits</div>
          </div>
        </div>

        {/* 位密度条 */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>Bit Density</span>
            <span>{getBitDensity()}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${getBitDensity()}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
