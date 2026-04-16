'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import JSZip from 'jszip'
import { cn } from './lib/utils'
import { useScorePlayback } from '@/hooks/useScorePlayback'
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
  cursor: {
    init: (manager: unknown, graphic: unknown) => void
    show: () => void
    hide: () => void
    update: () => void
    reset: () => void
    next: () => void
    previous: () => void
    nextMeasure: () => void
    previousMeasure: () => void
    updateCurrentPage: () => number
    currentPageNumber: number
  }
  sheet: {
    MusicPartManager: unknown
  }
  GraphicSheet: unknown
  setPageFormat: (formatId: string) => void
  setOptions: (options: Record<string, unknown>) => void
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
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)
  const [currentZoom, setCurrentZoom] = useState<number>(zoom)
  const [isDark, setIsDark] = useState(false)
  const [hasLoadedScore, setHasLoadedScore] = useState(false)
  const [rawXmlContent, setRawXmlContent] = useState<string | null>(null)
  // New interaction states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showKeyboardHint, setShowKeyboardHint] = useState(false)

  // Pagination state
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  // Score playback hook
  const {
    playbackState,
    parsedScore,
    play,
    pause,
    stop,
    seekToMeasure,
    setTempo,
    toggleLoop,
  } = useScorePlayback(rawXmlContent)

  // Reset controls timer on user interaction
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    // Auto-hide controls after 3 seconds of inactivity
    if (!isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isFullscreen])

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

          // Detect page count from OSMD pagination
          // OSMD creates page divs with class 'osmd-page' when pageFormat is set
          const pageElements = containerRef.current.querySelectorAll('.osmd-page')
          const detectedPages = pageElements.length > 0 ? pageElements.length : 1
          setPageCount(detectedPages)

          // Initialize OSMD cursor for playback highlighting
          // osmd.cursor.init(manager, graphic) requires the MusicPartManager and GraphicalMusicSheet
          try {
            const osmd = osmdInstanceRef.current
            if (osmd && osmd.cursor && osmd.sheet && osmd.GraphicSheet) {
              osmd.cursor.init(osmd.sheet.MusicPartManager, osmd.GraphicSheet)
              osmd.cursor.show()
              // Update current page after cursor init
              const pageNum = osmd.cursor.updateCurrentPage()
              setCurrentPage(pageNum > 0 ? pageNum : 1)
            }
          } catch (cursorErr) {
            logger.warn('Cursor init error:', cursorErr)
          }
        }
      }, 300)

      setTimeout(() => {
        setRawXmlContent(xmlContent)
      }, 100)

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
          // Enable pagination with A4 landscape format
          pageFormat: 'A4_P',
          // Enable cursor for playback sync
          disableCursor: false,
          followCursor: true,
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

  // Fullscreen toggle
  const handleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      logger.error('Fullscreen error:', err)
    }
  }, [])

  // Listen for fullscreen changes from browser (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return undefined

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleZoomIn()
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleZoomOut()
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleZoomReset()
          }
          break
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleFullscreen()
          }
          break
        case 'Escape':
          if (isFullscreen) {
            handleFullscreen()
          }
          break
        case '?':
          setShowKeyboardHint(prev => !prev)
          break
        case ' ':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            if (playbackState.isPlaying) {
              pause()
            } else {
              void play()
            }
          }
          break
        case 'ArrowLeft':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            seekToMeasure(Math.max(0, playbackState.currentMeasure - 1))
          }
          break
        case 'ArrowRight':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            if (parsedScore) {
              seekToMeasure(Math.min(parsedScore.measures - 1, playbackState.currentMeasure + 1))
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mounted, isFullscreen, handleFullscreen, handleZoomIn, handleZoomOut, handleZoomReset, playbackState, pause, play, parsedScore, seekToMeasure])

  // Mouse wheel zoom
  useEffect(() => {
    if (!mounted || !mainRef.current) return undefined

    const handleWheel = (e: WheelEvent) => {
      // Only zoom with Ctrl/Cmd + wheel (standard browser zoom gesture)
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setCurrentZoom(prev => Math.min(Math.max(prev + delta, 0.3), 4.0))
    }

    const main = mainRef.current
    main.addEventListener('wheel', handleWheel, { passive: false })
    return () => main.removeEventListener('wheel', handleWheel)
  }, [mounted])

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
      {/* Header Bar - auto-hides after inactivity */}
      <header
        className={cn(
          'z-50 flex items-center justify-between px-6 md:px-10 py-3 md:py-4 transition-all duration-500',
          isDark ? 'border-b border-white/5' : 'border-b border-black/5',
          showControls || !hasLoadedScore ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-6 md:gap-10">
          <button
            onClick={handleBack}
            className={cn(
              'text-[10px] uppercase tracking-[0.25em] font-medium transition-opacity opacity-50 hover:opacity-100',
              isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
            )}
          >
            ← Back
          </button>

          {/* First page / Last page navigation */}
          {pageCount > 1 && (
            <div className={cn('flex items-center gap-1 text-[10px]', isDark ? 'text-slate-500' : 'text-[#6b6b6b]')}>
              <button
                onClick={() => {
                  const osmd = osmdInstanceRef.current
                  if (osmd && osmd.cursor) {
                    osmd.cursor.reset()
                    osmd.cursor.update()
                    const pageNum = osmd.cursor.updateCurrentPage()
                    setCurrentPage(pageNum > 0 ? pageNum : 1)
                    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                  resetControlsTimer()
                }}
                className={cn(
                  'px-1.5 py-0.5 rounded transition-opacity opacity-50 hover:opacity-100',
                  isDark ? 'hover:text-slate-300' : 'hover:text-[#1a1a1a]'
                )}
                title="First page"
              >«</button>
              <button
                onClick={() => {
                  const osmd = osmdInstanceRef.current
                  if (osmd && osmd.cursor) {
                    // Move to the last measure
                    for (let i = 0; i < parsedScore.measures; i++) {
                      osmd.cursor.nextMeasure()
                    }
                    osmd.cursor.update()
                    const pageNum = osmd.cursor.updateCurrentPage()
                    setCurrentPage(pageNum > 0 ? pageNum : pageCount)
                    // Scroll to bottom
                    if (mainRef.current) {
                      mainRef.current.scrollTop = mainRef.current.scrollHeight
                    }
                  }
                  resetControlsTimer()
                }}
                className={cn(
                  'px-1.5 py-0.5 rounded transition-opacity opacity-50 hover:opacity-100',
                  isDark ? 'hover:text-slate-300' : 'hover:text-[#1a1a1a]'
                )}
                title="Last page"
              >»</button>
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] opacity-40">
            <Link href="/music" className={cn(
              'transition-opacity hover:opacity-100',
              isDark ? 'text-slate-500 hover:text-slate-300' : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
            )}>
              乐谱库
            </Link>
            <span className={isDark ? 'text-slate-600' : 'text-[#6b6b6b]/40'}>/</span>
            <span className={isDark ? 'text-slate-400' : 'text-[#6b6b6b]'}>
              {title || 'Untitled'}
            </span>
          </nav>
        </div>

        {/* Playback Controls - center area */}
        {parsedScore && parsedScore.notes.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => {
                if (playbackState.isPlaying) {
                  pause()
                } else {
                  void play()
                }
                resetControlsTimer()
              }}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-full transition-all',
                playbackState.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-amber-700/80 hover:bg-amber-600 text-amber-50 dark:bg-amber-600/80 dark:hover:bg-amber-500 dark:text-amber-50'
              )}
              title={playbackState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playbackState.isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Stop */}
            <button
              onClick={() => { stop(); resetControlsTimer() }}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100',
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#1a1a1a] hover:text-[#000]'
              )}
              title="Stop"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>

            {/* Tempo control */}
            <div className="hidden lg:flex items-center gap-1.5">
              <span className={cn(
                'text-[9px] uppercase tracking-wider opacity-40',
                isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
              )}>BPM</span>
              <input
                type="range"
                min="40"
                max="200"
                value={playbackState.tempo}
                onChange={(e) => {
                  setTempo(Number(e.target.value))
                  resetControlsTimer()
                }}
                onMouseDown={() => {
                  if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
                }}
                onMouseUp={resetControlsTimer}
                className={cn(
                  'w-16 h-1 rounded-full appearance-none cursor-pointer',
                  isDark ? 'bg-slate-700 accent-amber-400' : 'bg-zinc-300 accent-amber-600'
                )}
              />
              <span className={cn(
                'min-w-[32px] text-center text-[10px] font-medium',
                isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
              )}>
                {playbackState.tempo}
              </span>
            </div>

            {/* Loop toggle */}
            <button
              onClick={() => { toggleLoop(); resetControlsTimer() }}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100',
                playbackState.isLooping ? 'opacity-100 text-amber-600 dark:text-amber-400' : '',
                isDark ? 'text-slate-400' : 'text-[#1a1a1a]'
              )}
              title={playbackState.isLooping ? 'Loop: ON (click to disable)' : 'Loop: OFF (click to enable)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 3l4 4-4 4M3 11h18M7 21l-4-4 4-4M21 13H3" />
              </svg>
            </button>

            {/* Measure indicator */}
            <span className={cn(
              'text-[10px] tabular-nums font-medium',
              isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
            )}>
              {playbackState.currentMeasure + 1}/{parsedScore.measures}
            </span>

            {/* Page navigation */}
            <div className={cn(
              'flex items-center gap-1 text-[10px] tabular-nums',
              isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
            )}>
              <button
                onClick={() => {
                  const osmd = osmdInstanceRef.current
                  if (osmd && osmd.cursor) {
                    osmd.cursor.previousMeasure()
                    osmd.cursor.update()
                    const pageNum = osmd.cursor.updateCurrentPage()
                    setCurrentPage(pageNum > 0 ? pageNum : 1)
                  }
                  resetControlsTimer()
                }}
                className={cn(
                  'w-5 h-5 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100',
                  isDark ? 'hover:text-slate-200' : 'hover:text-[#1a1a1a]'
                )}
                title="Previous measure (←)"
              >‹</button>
              <span className="min-w-[28px] text-center font-medium">
                {currentPage}/{pageCount}
              </span>
              <button
                onClick={() => {
                  const osmd = osmdInstanceRef.current
                  if (osmd && osmd.cursor) {
                    osmd.cursor.nextMeasure()
                    osmd.cursor.update()
                    const pageNum = osmd.cursor.updateCurrentPage()
                    setCurrentPage(pageNum > 0 ? pageNum : 1)
                  }
                  resetControlsTimer()
                }}
                className={cn(
                  'w-5 h-5 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100',
                  isDark ? 'hover:text-slate-200' : 'hover:text-[#1a1a1a]'
                )}
                title="Next measure (→)"
              >›</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Zoom controls with slider */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => { handleZoomOut(); resetControlsTimer() }}
              className={cn(
                'w-7 h-7 flex items-center justify-center text-sm transition-opacity opacity-50 hover:opacity-100',
                isDark ? 'text-slate-300' : 'text-[#1a1a1a]'
              )}
              aria-label="Zoom out"
            >
              −
            </button>
            {/* Zoom slider */}
            <input
              type="range"
              min="30"
              max="400"
              value={Math.round(currentZoom * 100)}
              onChange={(e) => {
                const val = Number(e.target.value) / 100
                setCurrentZoom(val)
                resetControlsTimer()
              }}
              onMouseDown={() => {
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
              }}
              onMouseUp={resetControlsTimer}
              className={cn(
                'w-24 h-1 rounded-full appearance-none cursor-pointer',
                isDark
                  ? 'bg-slate-700 accent-slate-400'
                  : 'bg-zinc-300 accent-zinc-600'
              )}
              aria-label="Zoom level"
            />
            <button
              onClick={() => { handleZoomIn(); resetControlsTimer() }}
              className={cn(
                'w-7 h-7 flex items-center justify-center text-sm transition-opacity opacity-50 hover:opacity-100',
                isDark ? 'text-slate-300' : 'text-[#1a1a1a]'
              )}
              aria-label="Zoom in"
            >
              +
            </button>
            <span
              className={cn(
                'min-w-[44px] text-center text-[10px] tracking-[0.1em] font-medium',
                isDark ? 'text-slate-400' : 'text-[#6b6b6b]'
              )}
            >
              {Math.round(currentZoom * 100)}%
            </span>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => { handleFullscreen(); resetControlsTimer() }}
            className={cn(
              'w-8 h-8 flex items-center justify-center transition-opacity opacity-50 hover:opacity-100',
              isDark ? 'text-slate-300' : 'text-[#1a1a1a]'
            )}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>

          {/* Keyboard hint toggle */}
          <button
            onClick={() => { setShowKeyboardHint(prev => !prev); resetControlsTimer() }}
            className={cn(
              'w-8 h-8 flex items-center justify-center transition-opacity opacity-40 hover:opacity-100',
              isDark ? 'text-slate-400' : 'text-[#1a1a1a]'
            )}
            title="Keyboard shortcuts (?)"
            aria-label="Show keyboard shortcuts"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Thin Vertical Sidebar */}
        <aside
          className={cn(
            'hidden md:flex flex-col items-center py-10 z-40 w-14 gap-6',
            isDark ? 'border-r border-white/5' : 'border-r border-black/5'
          )}
        >
          {/* Zoom In */}
          <button
            onClick={() => { handleZoomIn(); resetControlsTimer() }}
            className={cn(
              'group relative flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Zoom In (+)"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => { handleZoomOut(); resetControlsTimer() }}
            className={cn(
              'group relative flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Zoom Out (-)"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>

          {/* Fit to page / Reset */}
          <button
            onClick={() => { handleZoomReset(); resetControlsTimer() }}
            className={cn(
              'flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Reset zoom (Ctrl+0)"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <div className={cn('w-4 h-px', isDark ? 'bg-white/5' : 'bg-black/5')} />

          {/* Fullscreen */}
          <button
            onClick={() => { handleFullscreen(); resetControlsTimer() }}
            className={cn(
              'flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? (
              <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>

          {/* Keyboard hint */}
          <button
            onClick={() => { setShowKeyboardHint(prev => !prev); resetControlsTimer() }}
            className={cn(
              'flex items-center justify-center w-8 h-8 transition-opacity opacity-40 hover:opacity-100',
            )}
            title="Keyboard shortcuts (?)"
          >
            <svg className={cn('w-[18px] h-[18px]', isDark ? 'text-slate-400' : 'text-[#1a1a1a]')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
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
          onMouseMove={resetControlsTimer}
          onTouchStart={resetControlsTimer}
        >
          {/* Metadata Header */}
          <div className="w-full max-w-3xl mx-auto mt-12 mb-12 px-6 md:px-0 md:ml-12">
            {/* Category + Difficulty tags */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={cn(
                  'text-[9px] uppercase tracking-[0.25em] font-medium px-3 py-1 rounded-full border',
                  isDark
                    ? 'text-amber-400/80 border-amber-500/30 bg-amber-500/5'
                    : 'text-amber-700/80 border-amber-300/50 bg-amber-50'
                )}
              >
                乐谱
              </span>
              {composer && (
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-[0.2em] font-light',
                    isDark ? 'text-slate-500' : 'text-[#6b6b6b]/60'
                  )}
                >
                  {composer}
                </span>
              )}
            </div>

            <h1
              className={cn(
                'text-3xl md:text-5xl font-light leading-tight tracking-tight mb-6',
                isDark ? 'text-[#e0e2ed]' : 'text-[#061542]'
              )}
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              {title || 'Untitled Score'}
            </h1>

            {description && (
              <p
                className={cn(
                  'text-sm leading-relaxed max-w-xl',
                  isDark ? 'text-slate-400' : 'text-[#6b6b6b]/70'
                )}
              >
                {description}
              </p>
            )}
          </div>

          {/* Keyboard shortcuts hint overlay */}
          {showKeyboardHint && (
            <div className="w-full max-w-lg mx-auto mb-8 px-6 md:px-0">
              <div
                className={cn(
                  'rounded-xl border p-5',
                  isDark
                    ? 'bg-[#12151e]/95 border-white/10 backdrop-blur-sm'
                    : 'bg-white/95 border-black/5 shadow-lg'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={cn(
                      'text-xs font-semibold uppercase tracking-widest',
                      isDark ? 'text-slate-300' : 'text-[#061542]'
                    )}
                  >
                    键盘快捷键
                  </h3>
                  <button
                    onClick={() => setShowKeyboardHint(false)}
                    className={cn(
                      'text-xs transition-opacity opacity-50 hover:opacity-100',
                      isDark ? 'text-slate-500' : 'text-[#6b6b6b]'
                    )}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'Space', desc: '播放 / 暂停' },
                    { key: '← →', desc: '上一小节 / 下一小节' },
                    { key: 'F', desc: '切换全屏' },
                    { key: 'Ctrl + 0', desc: '重置缩放' },
                    { key: 'Ctrl + +', desc: '放大' },
                    { key: 'Ctrl + -', desc: '缩小' },
                    { key: 'Ctrl + 滚轮', desc: '缩放（触控板）' },
                    { key: '?', desc: '切换此面板' },
                  ].map(({ key, desc }) => (
                    <div key={key} className="flex items-center gap-3">
                      <kbd
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono min-w-[80px] text-center',
                          isDark
                            ? 'bg-white/10 border border-white/15 text-slate-300'
                            : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
                        )}
                      >
                        {key}
                      </kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-[#6b6b6b]'}>
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                  isDark ? 'bg-[#12151e]' : 'bg-white',
                  // Dark mode score rendering: invert SVG colors
                  isDark && 'dark-score-svg'
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
