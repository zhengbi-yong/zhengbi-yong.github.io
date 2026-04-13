'use client'

import { useEffect, useRef, useState } from 'react'
import { applyViewerStyle, load3Dmol, resolveStructureSource } from './threeDmol'
import { resolveBooleanProp, resolveChemicalTextProp, resolveNumberProp } from './runtimeProps'
import { webGLContextManager } from '@/lib/webgl/WebGLContextManager'

declare global {
  interface Window {
    $3Dmol: any
  }
}

interface ChemicalStructureProps {
  file?: string
  data?: string
  dataBase64?: string
  format?: string
  width?: number | string
  height?: number | string
  style?: 'stick' | 'cartoon' | 'sphere' | 'surface' | 'line'
  backgroundColor?: string
  className?: string
  autoRotate?: boolean
  /** Activity visibility state - when false, viewer is paused */
  isActive?: boolean
}

/**
 * Chemical structure viewer using 3Dmol.js
 *
 * GOLDEN_RULES 2.3: Activity cleanup must be idempotent (pause, not destroy)
 * GOLDEN_RULES 2.4: Max 6 WebGL contexts with LRU eviction
 *
 * This component now supports Activity visibility transitions:
 * - When isActive=false: saves snapshot, pauses rendering
 * - When isActive=true: resumes rendering from snapshot
 */
export default function SimpleChemicalStructure({
  file,
  data,
  dataBase64,
  format,
  width = '100%',
  height = 400,
  style = 'stick',
  backgroundColor,
  className = '',
  autoRotate = false,
  isActive = true,
}: ChemicalStructureProps) {
  const resolvedData = resolveChemicalTextProp(data, dataBase64)
  const resolvedHeight = resolveNumberProp(height, 400)
  const resolvedAutoRotate = resolveBooleanProp(autoRotate, false)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [_isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  // Unique ID for WebGL context management
  const contextIdRef = useRef<string | null>(null)

  const getContextId = () => {
    if (!contextIdRef.current) {
      contextIdRef.current = `3dmol-viewer-${Math.random().toString(36).substr(2, 9)}`
    }
    return contextIdRef.current
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle Activity visibility changes
  useEffect(() => {
    if (!isClient) return

    const id = getContextId()

    if (!isActive) {
      // Activity hidden: pause rendering, save snapshot
      const savedSnapshot = webGLContextManager.pause(id)
      if (savedSnapshot) {
        setSnapshot(savedSnapshot)
      }
    } else {
      // Activity visible: resume rendering
      webGLContextManager.resume(id)
      setSnapshot(null)
    }
  }, [isActive, isClient])

  // prevent TS6133: using _isLoading to reflect loading state without altering logic
  useEffect(() => {
    void _isLoading
  }, [_isLoading])

  useEffect(() => {
    if (!isClient || !containerRef.current) return undefined

    let isCancelled = false

    const initViewer = async () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const id = getContextId()

      // Apply rendering style and background color for the viewer
      container.setAttribute('data-style', String(style))
      if (typeof backgroundColor === 'string') {
        container.style.backgroundColor = backgroundColor
      }
      container.style.width = typeof width === 'number' ? `${width}px` : width
      container.style.height =
        typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight
      container.style.position = 'relative'
      container.style.overflow = 'hidden'

      try {
        setError(null)
        setIsLoading(true)

        const [threeDmol, source] = await Promise.all([
          load3Dmol(),
          resolveStructureSource({ file, data: resolvedData, format }),
        ])

        if (isCancelled || !containerRef.current) {
          return
        }

        // Create viewer and manage its WebGL context
        const viewer = threeDmol.createViewer(container, {
          backgroundColor: backgroundColor || '#ffffff',
        }) as any

        viewerRef.current = viewer

        // Register context with manager for LRU management
        const canvas = container.querySelector('canvas')
        if (canvas) {
          webGLContextManager.acquire(id, canvas)
        }

        viewer.addModel(source.data, source.format)
        applyViewerStyle(viewer, threeDmol, style)

        if (resolvedAutoRotate) {
          viewer.spin(true)
        }

        viewer.zoomTo()
        viewer.render()

        // Register context event handlers
        if (canvas) {
          webGLContextManager.onContextEvent(id, (ctxId, event) => {
            if (event.type === 'webglcontextlost') {
              console.warn(`[ChemicalStructure] Context ${ctxId} lost`)
            } else if (event.type === 'webglcontextrestored') {
              console.info(`[ChemicalStructure] Context ${ctxId} restored`)
            }
          })
        }

        if (isCancelled) {
          return
        }

        setIsLoading(false)
      } catch (err) {
        if (isCancelled) {
          return
        }

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

    // Cleanup - GOLDEN_RULES 2.3: Only pause, don't destroy
    // This allows Activity to restore the viewer without recreation
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }

      isCancelled = true

      const id = getContextId()

      // Pause context instead of destroying (idempotent)
      webGLContextManager.pause(id)

      // Don't destroy the viewer - it may need to be restored
      // Just clear the ref
      viewerRef.current = null
    }
  }, [
    isClient,
    file,
    resolvedData,
    format,
    width,
    resolvedHeight,
    style,
    backgroundColor,
    resolvedAutoRotate,
  ])

  // Show snapshot when paused (Activity hidden)
  if (snapshot && !isActive) {
    return (
      <div
        className={`my-6 flex max-w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{
          width,
          height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
          maxWidth: '100%',
        }}
      >
        <img
          src={snapshot}
          alt="3D molecular structure paused"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (!isClient) {
    return (
      <div
        className={`my-6 flex max-w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{
          width,
          height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
          maxWidth: '100%',
        }}
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
        style={{
          width,
          height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
          maxWidth: '100%',
        }}
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
        height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    />
  )
}
