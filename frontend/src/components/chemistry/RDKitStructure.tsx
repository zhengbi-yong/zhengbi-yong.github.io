'use client'

import { useState, useEffect } from 'react'
import { useChemistryLocal, detectChemicalFormat } from '@/lib/hooks/useChemistryLocal'

interface RDKitStructureProps {
  data: string
  width?: number | string
  height?: number | string
  backgroundColor?: string
  atomLabelSize?: number
  bondWidth?: number
  showAtomNumbers?: boolean
  className?: string
  style?: 'normal' | 'publication' | 'draft'
}

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
  void showAtomNumbers;
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const chemistryData = useChemistryLocal()
  const isLoaded = chemistryData.isLoaded
  const smilesToSVG = chemistryData.smilesToSVG
  const molToSVG = chemistryData.molToSVG
  const rdkitError = chemistryData.error
  const [directRDKitAvailable, setDirectRDKitAvailable] = useState(false)

  // Check for direct RDKit access on mount (client-side only)
  useEffect(() => {
    setDirectRDKitAvailable(
      typeof window !== 'undefined' && typeof (window as any).RDKit !== 'undefined' && (window as any).RDKit
    )
  }, [])

  useEffect(() => {
    const generateSVG = async () => {
      if (!data || typeof data !== 'string' || !data.trim()) {
        setError('No chemical data provided')
        setIsLoading(false)
        return
      }

      if (!isLoaded && !directRDKitAvailable) {
        return
      }

      try {
        console.log('[RDKitStructure] Attempting to generate SVG for data:', data?.substring(0, 50))

        if (directRDKitAvailable) {
          const RDKit = (window as any).RDKit
          const format = detectChemicalFormat(data)

          let svg = ''
          switch (format) {
            case 'smiles':
              const mol = RDKit.get_mol(data)
              if (!mol) throw new Error('Invalid SMILES string')
              svg = mol.get_svg()
              if (!svg) throw new Error('Failed to generate SVG from SMILES')
              mol.delete()
              break
            case 'mol':
            case 'sdf':
              const mol2 = RDKit.get_mol(data)
              if (!mol2) throw new Error('Invalid MOL data')
              svg = mol2.get_svg()
              if (!svg) throw new Error('Failed to generate SVG from MOL')
              mol2.delete()
              break
            default:
              throw new Error(`Unsupported format: ${format}`)
          }

          const optimizedSVG = optimizeSVG(svg)
          setSvgContent(optimizedSVG)
          setIsLoading(false)
          setError('')
        } else {
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

          const optimizedSVG = optimizeSVG(svg)
          setSvgContent(optimizedSVG)
          setError('')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render structure'
        setError(errorMessage)
        setSvgContent('')
        console.error('[RDKitStructure] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    generateSVG()
  }, [data, isLoaded, directRDKitAvailable, smilesToSVG, molToSVG])

  function optimizeSVG(svg: string): string {
    return svg
      .replace(/<svg([^>]*)>/, `<svg$1 style="background-color: ${backgroundColor};">`)
  .replace(/width="(\d+)" height="(\d+)"/, (match, _w, _h) => {
        if (typeof width === 'number') {
          return `width="${width}" height="${height}"`
        }
        return match
      })
  }

  function getStyleConfig() {
    const configs = {
      normal: { borderWidth: bondWidth, labelSize: atomLabelSize },
      publication: { borderWidth: bondWidth + 1, labelSize: atomLabelSize - 2 },
      draft: { borderWidth: bondWidth - 1, labelSize: atomLabelSize + 2 },
    }
    return configs[style]
  }

  const styleConfig = getStyleConfig()
  void styleConfig

  if (rdkitError) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-lg border-2 border-dashed border-red-300 p-4 ${className}`}
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
        style={{ width, height, backgroundColor, maxWidth: '100%' }}
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
        <div className="text-center">RDKitError: {error}</div>
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
            }}
          />
        )}
      </div>
    </div>
  )
}
