'use client'

import { useEffect, useState } from 'react'
import { useChemistryLocal, detectChemicalFormat } from '@/lib/hooks/useChemistryLocal'
import {
  resolveBooleanProp,
  resolveChemicalTextProp,
  resolveNumberProp,
} from './runtimeProps'

interface RDKitStructureProps {
  data?: string
  dataBase64?: string
  width?: number | string
  height?: number | string
  backgroundColor?: string
  atomLabelSize?: number | string
  bondWidth?: number | string
  showAtomNumbers?: boolean | string
  className?: string
  style?: 'normal' | 'publication' | 'draft'
}

export default function RDKitStructure({
  data,
  dataBase64,
  width = '100%',
  height = 300,
  backgroundColor = '#ffffff',
  atomLabelSize = 16,
  bondWidth = 2,
  showAtomNumbers = false,
  className = '',
  style = 'normal',
}: RDKitStructureProps) {
  const resolvedData = resolveChemicalTextProp(data, dataBase64)
  const resolvedHeight = resolveNumberProp(height, 300)
  const resolvedAtomLabelSize = resolveNumberProp(atomLabelSize, 16)
  const resolvedBondWidth = resolveNumberProp(bondWidth, 2)
  const resolvedShowAtomNumbers = resolveBooleanProp(showAtomNumbers, false)

  void resolvedShowAtomNumbers

  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const { isLoaded, error: rdkitError, smilesToSVG, molToSVG } = useChemistryLocal()

  useEffect(() => {
    if (!resolvedData || typeof resolvedData !== 'string' || !resolvedData.trim()) {
      setError('No chemical data provided')
      setSvgContent('')
      setIsLoading(false)
      return undefined
    }

    if (!isLoaded) {
      return undefined
    }

    let cancelled = false

    const generateSVG = async () => {
      try {
        setIsLoading(true)
        setError('')

        const format = detectChemicalFormat(resolvedData)
        let svg = ''

        switch (format) {
          case 'smiles':
            svg = await smilesToSVG(resolvedData)
            break
          case 'mol':
          case 'sdf':
            svg = await molToSVG(resolvedData)
            break
          default:
            throw new Error(`Unsupported format: ${format}`)
        }

        if (cancelled) {
          return
        }

        setSvgContent(optimizeSVG(svg))
      } catch (err) {
        if (cancelled) {
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to render structure'
        setError(errorMessage)
        setSvgContent('')
        console.error('[RDKitStructure] Error:', err)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void generateSVG()

    return () => {
      cancelled = true
    }
  }, [resolvedData, isLoaded, smilesToSVG, molToSVG, backgroundColor, width, height])

  function optimizeSVG(svg: string): string {
    return svg
      .replace(/<svg([^>]*)>/, `<svg$1 style="background-color: ${backgroundColor};">`)
      .replace(/width="(\d+)" height="(\d+)"/, (match) => {
        if (typeof width === 'number') {
          return `width="${width}" height="${resolvedHeight}"`
        }

        return match
      })
  }

  function getStyleConfig() {
    const configs = {
      normal: { borderWidth: resolvedBondWidth, labelSize: resolvedAtomLabelSize },
      publication: { borderWidth: resolvedBondWidth + 1, labelSize: resolvedAtomLabelSize - 2 },
      draft: { borderWidth: resolvedBondWidth - 1, labelSize: resolvedAtomLabelSize + 2 },
    }

    return configs[style]
  }

  const styleConfig = getStyleConfig()
  void styleConfig

  if (rdkitError) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-lg border-2 border-dashed border-red-300 p-4 ${className}`}
        style={{ width, height: resolvedHeight, backgroundColor, maxWidth: '100%' }}
      >
        <div className="text-center">
          <div className="mb-2 text-red-500">Chemistry Engine Error</div>
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
        style={{ width, height: resolvedHeight, backgroundColor, maxWidth: '100%' }}
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
        style={{ width, height: resolvedHeight, backgroundColor, maxWidth: '100%' }}
      >
        <div className="text-center">RDKitError: {error}</div>
      </div>
    )
  }

  return (
    <div className={`flex max-w-full flex-col items-center ${className}`}>
      <div
        className="overflow-hidden rounded-lg border border-gray-200"
        style={{
          width,
          height: resolvedHeight,
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
            }}
          />
        )}
      </div>
    </div>
  )
}
