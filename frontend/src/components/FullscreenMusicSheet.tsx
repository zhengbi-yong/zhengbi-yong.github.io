'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import JSZip from 'jszip'
import { cn } from './lib/utils'
// Theme is detected from DOM via MutationObserver (portal is outside React context)

// Simple logger for development
const logger = {
  log: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  debug: (...args: unknown[]) => console.debug(...args),
}

// Type for OpenSheetMusicDisplay (loaded dynamically)
interface OpenSheetMusicDisplay {
  load: (score: string) => Promise<void>
  render: () => void
  zoom: number
  clear: () => void
}

interface FullscreenMusicSheetProps {
  /** MusicXML public asset path or filename */
  src: string
  /** Zoom level, default 1.0 */
  zoom?: number
  /** Whether to show title info, default true */
  drawTitle?: boolean
  /** Whether to show measure numbers, default true */
  drawMeasureNumbers?: boolean
  /** Title */
  title?: string
  /** Composer */
  composer?: string
  /** Description */
  description?: string
}

export default function FullscreenMusicSheet({
  src,
  zoom = 1.0,
  drawTitle = true,
  drawMeasureNumbers = true,
  title,
  composer,
  description,
}: FullscreenMusicSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)
  const [currentZoom, setCurrentZoom] = useState<number>(zoom)
  const [isDark, setIsDark] = useState(false)
  const [hasLoadedScore, setHasLoadedScore] = useState(false)

  useEffect(() => {
    // Read theme directly from DOM since portal renders outside React context tree
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkTheme()

    // Observe class changes on <html> for theme switching
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const getBasePath = (): string => {
    if (typeof window === 'undefined') return ''

    const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH
    if (envBasePath) {
      return envBasePath.startsWith('/') ? envBasePath : `/${envBasePath}`
    }

    const pathname = window.location.pathname
    const segments = pathname.split('/').filter(Boolean)
    const knownAppRoutes = ['experiment', 'blog', 'tags', 'about', 'projects', 'music']
    const nextJsRoutes = ['_next', 'api', 'static']

    if (segments.length >= 1) {
      const firstSegment = segments[0]
      if (nextJsRoutes.includes(firstSegment)) {
        return ''
      }
      if (!knownAppRoutes.includes(firstSegment)) {
        return `/${firstSegment}`
      }
    }

    return ''
  }

  const extractMXL = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const zip = await JSZip.loadAsync(arrayBuffer)

    let rootFilePath = ''

    const containerFile = zip.files['META-INF/container.xml']
    if (containerFile) {
      try {
        const containerXml = await containerFile.async('string')
        const parser = new DOMParser()
        const doc = parser.parseFromString(containerXml, 'text/xml')
        const rootfile = doc.querySelector('rootfile')
        if (rootfile) {
          rootFilePath = rootfile.getAttribute('full-path') || ''
        }
      } catch (err) {
        logger.warn('Cannot parse container.xml:', err)
      }
    }

    if (!rootFilePath) {
      const xmlFiles = Object.keys(zip.files).filter(
        (name) => name.endsWith('.xml') && !zip.files[name].dir && !name.startsWith('META-INF/')
      )

      if (xmlFiles.length === 0) {
        throw new Error('No MusicXML file found in MXL archive')
      }

      rootFilePath =
        xmlFiles.find(
          (name) => name.toLowerCase().includes('score') || name.toLowerCase().includes('partwise')
        ) || xmlFiles[0]
    }

    const rootFile = zip.files[rootFilePath]
    if (!rootFile) {
      throw new Error(`Root file not found in MXL: ${rootFilePath}`)
    }

    const xmlContent = await rootFile.async('string')

    if (!xmlContent.includes('<score-partwise') && !xmlContent.includes('<score-timewise')) {
      throw new Error('Extracted file is not valid MusicXML')
    }

    return xmlContent
  }

  const normalizeMusicAssetPath = (filePath: string): string => {
    if (filePath.startsWith('/')) {
      return filePath
    }

    return `/musicxml/${filePath.replace(/^\/+/, '')}`
  }

  const applyCenteredScoreLayout = () => {
    if (!containerRef.current) {
      return
    }

    const svg = containerRef.current.querySelector('svg')
    if (svg) {
      svg.style.removeProperty('left')
      svg.style.removeProperty('right')
      svg.style.removeProperty('transform')
      svg.style.removeProperty('position')
      svg.style.margin = '0 auto'
      svg.style.display = 'block'
      svg.style.maxWidth = '100%'

      containerRef.current.style.textAlign = 'center'
      containerRef.current.style.display = 'flex'
      containerRef.current.style.flexDirection = 'column'
      containerRef.current.style.alignItems = 'center'
      containerRef.current.style.justifyContent = 'flex-start'
    }
  }

  const loadMusicXML = async (filePath: string) => {
    if (!osmdInstanceRef.current) {
      setError('OSMD instance not initialized')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setHasLoadedScore(false)

    try {
      const basePath = getBasePath()
      const normalizedPath = normalizeMusicAssetPath(filePath)
      const isMXL = normalizedPath.toLowerCase().endsWith('.mxl')
      const pathWithBase = basePath && normalizedPath.startsWith(`${basePath}/`)
        ? normalizedPath
        : `${basePath}${normalizedPath}`

      const possiblePaths = [
        pathWithBase,
        normalizedPath,
        `${window.location.origin}${pathWithBase}`,
        `${window.location.origin}${normalizedPath}`,
      ]

      let xmlContent = ''
      let xmlPath = ''

      for (const path of possiblePaths) {
        try {
          const response = await fetch(path)
          if (response.ok) {
            if (isMXL) {
              const arrayBuffer = await response.arrayBuffer()
              xmlContent = await extractMXL(arrayBuffer)
              xmlPath = path
              break
            } else {
              const contentType = response.headers.get('content-type') || ''
              if (contentType.includes('xml') || contentType.includes('text')) {
                xmlContent = await response.text()
                if (xmlContent.trim().startsWith('<?xml')) {
                  xmlPath = path
                  break
                }
              }
            }
          }
        } catch {
          // Try next path
        }
      }

      if (!xmlContent) {
        throw new Error(`Cannot find or load MusicXML file: ${filePath}`)
      }

      try {
        if (xmlPath && !isMXL) {
          await osmdInstanceRef.current.load(xmlPath)
        } else {
          await osmdInstanceRef.current.load(xmlContent)
        }
      } catch (urlError) {
        logger.warn('URL load failed, trying XML string:', urlError)
        await osmdInstanceRef.current.load(xmlContent)
      }

      osmdInstanceRef.current.zoom = currentZoom
      osmdInstanceRef.current.render()

      setTimeout(() => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector('svg')
          if (svg) {
            svg.style.removeProperty('left')
            svg.style.removeProperty('right')
            svg.style.removeProperty('transform')
            svg.style.removeProperty('position')
            svg.style.margin = '0 auto'
            svg.style.display = 'block'
            svg.style.maxWidth = '100%'

            containerRef.current.style.textAlign = 'center'
            containerRef.current.style.display = 'flex'
            containerRef.current.style.flexDirection = 'column'
            containerRef.current.style.alignItems = 'center'
            containerRef.current.style.justifyContent = 'flex-start'
          }
        }
      }, 200)

      setIsLoading(false)
    } catch (err) {
      logger.error('Load score error:', err)
      setHasLoadedScore(false)
      setError(`Failed to load score: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted || !containerRef.current) return undefined

    const initializeOSMD = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const OSMDModule = await import('opensheetmusicdisplay')

        let OpenSheetMusicDisplayClass: any = null

        if (OSMDModule.OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = OSMDModule.OpenSheetMusicDisplay
        } else if ((OSMDModule as any).default) {
          const defaultExport = (OSMDModule as any).default
          if (defaultExport.OpenSheetMusicDisplay) {
            OpenSheetMusicDisplayClass = defaultExport.OpenSheetMusicDisplay
          } else if (typeof defaultExport === 'function') {
            OpenSheetMusicDisplayClass = defaultExport
          }
        } else if (typeof window !== 'undefined' && (window as any).OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = (window as any).OpenSheetMusicDisplay
        }

        if (!OpenSheetMusicDisplayClass) {
          throw new Error('Cannot find OpenSheetMusicDisplay class')
        }

        const osmd = new OpenSheetMusicDisplayClass(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawTitle,
          drawSubtitle: drawTitle,
          drawComposer: drawTitle,
          drawLyricist: drawTitle,
          drawPartNames: true,
          drawMeasureNumbers,
          drawTimeSignatures: true,
        })

        osmdInstanceRef.current = osmd

        await loadMusicXML(src)
      } catch (err) {
        logger.error('OSMD init error:', err)
        setError(`Initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      void initializeOSMD()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (osmdInstanceRef.current) {
        osmdInstanceRef.current = null
      }
      setHasLoadedScore(false)
    }
  }, [mounted, src, drawTitle, drawMeasureNumbers])

  useEffect(() => {
    if (osmdInstanceRef.current && hasLoadedScore && !isLoading && !error) {
      osmdInstanceRef.current.zoom = currentZoom
      osmdInstanceRef.current.render()

      setTimeout(() => {
        applyCenteredScoreLayout()
      }, 200)
    }
  }, [currentZoom, hasLoadedScore, isLoading, error])

  const handleZoomIn = useCallback(() => {
    setCurrentZoom((prev) => Math.min(prev + 0.15, 3.0))
  }, [])

  const handleZoomOut = useCallback(() => {
    setCurrentZoom((prev) => Math.max(prev - 0.15, 0.5))
  }, [])

  const handleZoomReset = useCallback(() => {
    setCurrentZoom(zoom)
  }, [zoom])

  const handleBack = useCallback(() => {
    window.history.back()
  }, [])

  if (!mounted) {
    return null
  }

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col h-screen overflow-hidden',
        isDark
          ? 'bg-[#0a0c12] text-[#e0e2ed]'
          : 'bg-gradient-to-br from-[#fdfdfc] via-[#f8f7f4] to-[#f2f1ed] text-[#1a1a1a]'
      )}
    >
      {/* Header Bar */}
      <header
        className={cn(
          'z-50 flex items-center justify-between px-8 md:px-12 py-4 md:py-5',
          isDark ? 'border-b border-white/5' : 'border-b border-black/5'
        )}
      >
        <div className="flex items-center gap-8 md:gap-12">
          <button
            onClick={handleBack}
            className={cn(
              'text-[10px] uppercase tracking-[0.3em] font-medium transition-opacity opacity-60 hover:opacity-100',
              isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
            )}
          >
            ← Back
          </button>
          {composer && (
            <div
              className={cn(
                'hidden md:block text-[9px] uppercase tracking-[0.25em] font-medium',
                isDark ? 'text-slate-500' : 'text-[#6b6b6b]/60'
              )}
            >
              {composer}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm transition-opacity opacity-50 hover:opacity-100',
                isDark ? 'text-slate-300' : 'text-[#1a1a1a]'
              )}
              aria-label="Zoom out"
            >
              −
            </button>
            <span
              className={cn(
                'min-w-[48px] text-center text-[10px] tracking-[0.1em] font-medium',
                isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
              )}
            >
              {Math.round(currentZoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm transition-opacity opacity-50 hover:opacity-100',
                isDark ? 'text-slate-300' : 'text-[#1a1a1a]'
              )}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={handleZoomReset}
              className={cn(
                'ml-2 text-[9px] uppercase tracking-[0.15em] font-medium transition-opacity opacity-40 hover:opacity-100',
                isDark ? 'text-slate-500' : 'text-[#6b6b6b]'
              )}
              aria-label="Reset zoom"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Thin Vertical Sidebar */}
        <aside
          className={cn(
            'hidden md:flex flex-col items-center py-10 z-40 w-14 gap-8',
            isDark ? 'border-r border-white/5' : 'border-r border-black/5'
          )}
        >
          <button
            onClick={handleZoomIn}
            className={cn(
              'group relative flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Zoom In"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className={cn(
              'group relative flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Zoom Out"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <div className={cn('w-4 h-px', isDark ? 'bg-white/5' : 'bg-black/5')} />
          <button
            onClick={handleZoomReset}
            className={cn(
              'flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Fit to page"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </aside>

        {/* Score Canvas */}
        <main
          ref={mainRef}
          className={cn(
            'flex-1 ml-0 md:ml-14 overflow-y-auto overflow-x-hidden flex flex-col items-center relative group/canvas',
            isDark ? 'bg-[#0a0c12]' : ''
          )}
        >
          {/* Metadata Header */}
          <div className="w-full max-w-3xl mx-auto mt-16 mb-16 px-8 md:px-0 md:ml-12">
            <div
              className={cn(
                'mb-3 text-[9px] uppercase tracking-[0.35em] font-medium opacity-50',
                isDark ? 'text-slate-500' : 'text-[#6b6b6b]'
              )}
            >
              Score Selection
            </div>
            <h1
              className={cn(
                'text-3xl md:text-4xl font-light leading-tight mb-3 tracking-tight',
                isDark ? 'text-[#e0e2ed]' : 'text-[#061542]'
              )}
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              {title || 'Untitled Score'}
            </h1>
            {composer && (
              <p
                className={cn(
                  'text-[11px] tracking-[0.35em] font-light uppercase pl-6 ml-1',
                  isDark
                    ? 'text-slate-500 border-l border-slate-700'
                    : 'text-[#6b6b6b] border-l border-[#061542]/20'
                )}
              >
                {composer}
              </p>
            )}
            {description && (
              <p
                className={cn(
                  'mt-4 text-sm leading-relaxed max-w-lg',
                  isDark ? 'text-slate-500' : 'text-[#6b6b6b]/70'
                )}
              >
                {description}
              </p>
            )}
          </div>

          {/* Score Page */}
          <div className="w-full max-w-5xl mb-32 px-4 md:px-8">
            <div
              className={cn(
                'relative w-full p-8 md:p-16 select-none',
                isDark
                  ? 'bg-[#12151e] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15),0_12px_32px_rgba(0,0,0,0.1)]'
                  : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.04),0_32px_64px_-12px_rgba(0,0,0,0.05)]'
              )}
            >
              {/* Loading State */}
              {isLoading && (
                <div className="flex h-64 items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className={cn(
                        'h-8 w-8 border-2 rounded-full animate-spin',
                        isDark
                          ? 'border-slate-600 border-t-transparent'
                          : 'border-[#061542] border-t-transparent'
                      )}
                    />
                    <p
                      className={cn(
                        'text-[10px] uppercase tracking-[0.2em]',
                        isDark ? 'text-slate-500' : 'text-[#6b6b6b]/60'
                      )}
                    >
                      Loading score...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center max-w-sm">
                    <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Score Container */}
              <div
                ref={containerRef}
                className={cn(
                  isLoading || error ? 'hidden' : '',
                  isDark ? 'bg-[#12151e]' : 'bg-white'
                )}
                style={{
                  maxWidth: '100%',
                  width: '100%',
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body)
  }

  return null
}
