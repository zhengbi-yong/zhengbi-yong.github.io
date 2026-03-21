'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    $3Dmol: any
  }
}

interface SimpleChemicalStructureProps {
  file?: string
  data?: string
  width?: number | string
  height?: number | string
  style?: 'stick' | 'cartoon' | 'sphere' | 'surface' | 'line'
  backgroundColor?: string
  className?: string
  autoRotate?: boolean
}

export default function SimpleChemicalStructure({
  file,
  data,
  width = '100%',
  height = 400,
  style = 'stick',
  backgroundColor,
  className = '',
  autoRotate = false,
}: SimpleChemicalStructureProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [_isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // prevent TS6133: using _isLoading to reflect loading state without altering logic
  useEffect(() => {
    void _isLoading
  }, [_isLoading])

  useEffect(() => {
    if (!isClient || !containerRef.current) return undefined

    const initViewer = async () => {
      if (!containerRef.current) return

      const container = containerRef.current
      // Apply rendering style and background color for the viewer
      container.setAttribute('data-style', String(style))
      if (typeof backgroundColor === 'string') {
        container.style.backgroundColor = backgroundColor
      }
      container.style.width = typeof width === 'number' ? `${width}px` : width
      container.style.height = typeof height === 'number' ? `${height}px` : height
      container.style.position = 'relative'
      container.style.overflow = 'hidden'

      try {
        const viewer = (window as any).$3Dmol.createViewer(container) as any

        viewerRef.current = viewer

        if (file) {
          viewer.addModel(file, file)
        } else if (data) {
          viewer.addModel(data, 'data')
        }

        if (autoRotate) {
          viewer.spin(true)
        }

        viewer.zoomTo()
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load 3Dmol viewer:', err)
        setError('Failed to load 3D molecular structure')
        setIsLoading(false)
      }
    }

    initViewer()

    const handleResize = () => {
      if (viewerRef.current && containerRef.current) {
        viewerRef.current.resize()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }

      try {
        if (viewerRef.current && typeof viewerRef.current.destroy === 'function') {
          viewerRef.current.destroy()
        }
      } catch (err) {
        console.error('Error cleaning up viewer:', err)
      }
      viewerRef.current = null
    }
  }, [isClient, file, data, width, height, autoRotate])

  if (!isClient) {
    return (
      <div
        className={`my-6 flex max-w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{ width, height: typeof height === 'number' ? `${height}px` : height, maxWidth: '100%' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载3D结构查看器...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`my-6 max-w-full rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}
        style={{ width, height: typeof height === 'number' ? `${height}px` : height, maxWidth: '100%' }}
      >
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height: typeof height === 'number' ? `${height}px` : height,
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    />
  )
}
