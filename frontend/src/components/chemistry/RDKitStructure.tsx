'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChemistryLocal, detectChemicalFormat } from '@/lib/hooks/useChemistryLocal'

interface RDKitStructureProps {
  /** 化学结构数据 (SMILES, MOL, SDF格式) */
  data: string
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 背景色 */
  backgroundColor?: string
  /** 原子标签大小 */
  atomLabelSize?: number
  /** 键宽度 */
  bondWidth?: number
  /** 显示原子序号 */
  showAtomNumbers?: boolean
  /** 自定义类名 */
  className?: string
  /** 样式类型 */
  style?: 'normal' | 'publication' | 'draft'
}

/**
 * RDKitStructure - 2D化学结构可视化组件
 * 基于 RDKit.js 生成高质量的2D矢量图
 */
export default function RDKitStructure({
  data,
  width = '100%',
  height = 300,
  backgroundColor = '#ffffff',
  atomLabelSize = 16,
  bondWidth = 2,
  showAtomNumbers = false,
  className = '',
  style = 'normal',
}: RDKitStructureProps) {
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const { isLoaded, error: rdkitError, smilesToSVG, molToSVG } = useChemistryLocal()

  // 优化SVG显示
  const optimizeSVG = useCallback(
    (svg: string): string => {
      // 设置背景色和样式
      const optimized = svg
        .replace(/<svg([^>]*)>/, `<svg$1 style="background-color: ${backgroundColor};">`)
        .replace(/width="(\d+)" height="(\d+)"/, (match, w, h) => {
          // 如果指定了宽高，使用指定值
          if (typeof width === 'number') {
            return `width="${width}" height="${height}"`
          }
          return match
        })

      return optimized
    },
    [backgroundColor, width, height]
  )

  useEffect(() => {
    const generateSVG = async () => {
      if (!data || typeof data !== 'string' || !data.trim()) {
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

        let svg = ''
        switch (format) {
          case 'smiles':
            svg = await smilesToSVG(data)
            break
          case 'mol':
          case 'sdf':
            svg = await molToSVG(data)
            break
          default:
            throw new Error(`Unsupported format: ${format}`)
        }

        // 优化SVG显示
        const optimizedSVG = optimizeSVG(svg)
        setSvgContent(optimizedSVG)
        setError('')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render structure'
        setError(errorMessage)
        setSvgContent('')
        console.error('RDKit rendering error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    generateSVG()
  }, [data, isLoaded, smilesToSVG, molToSVG, optimizeSVG])

  // 获取样式配置
  const getStyleConfig = () => {
    const configs = {
      normal: { borderWidth: bondWidth, labelSize: atomLabelSize },
      publication: { borderWidth: bondWidth + 1, labelSize: atomLabelSize - 2 },
      draft: { borderWidth: bondWidth - 1, labelSize: atomLabelSize + 2 },
    }
    return configs[style]
  }

  const styleConfig = getStyleConfig()

  if (rdkitError) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 ${className}`}
        style={{ width, height, backgroundColor, maxWidth: '100%' }}
      >
        <div className="text-center">
          <div className="mb-2 text-red-500">⚠️ Chemistry Engine Error</div>
          <div className="text-sm text-gray-600">{rdkitError}</div>
          <div className="mt-1 text-xs text-gray-500">Please check your internet connection</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 ${className}`}
        style={{ width, height, maxWidth: '100%' }}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <div className="text-sm text-gray-600">Loading chemistry engine...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-lg border-2 border-dashed border-red-300 p-4 ${className}`}
        style={{ width, height, backgroundColor, maxWidth: '100%' }}
      >
        <div className="text-center">
          <div className="mb-2 text-red-500">❌ Structure Error</div>
          <div className="text-sm text-gray-600">{error}</div>
          <div className="mt-1 text-xs text-gray-500">
            Format: {data ? detectChemicalFormat(data) : 'unknown'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center max-w-full ${className}`}>
      <div
        className="overflow-hidden rounded-lg border border-gray-200"
        style={{
          width,
          height,
          maxWidth: '100%',
        }}
      >
        {svgContent && (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="h-full w-full"
            style={{
              backgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )}
      </div>

      {/* 结构信息 */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Format: {detectChemicalFormat(data).toUpperCase()} | Rendered with RDKit.js
      </div>
    </div>
  )
}
