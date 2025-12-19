'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from '@/components/loaders'
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import JSZip from 'jszip'

interface FullscreenMusicSheetProps {
  /** MusicXML 文件路径，相对于 public/musicxml/ 目录，支持 .xml 和 .mxl 格式 */
  src: string
  /** 缩放级别，默认 1.0 */
  zoom?: number
  /** 是否显示标题等信息，默认 true */
  drawTitle?: boolean
  /** 是否显示小节号，默认 true */
  drawMeasureNumbers?: boolean
  /** 标题 */
  title?: string
}

/**
 * 全屏乐谱组件 - 用于全屏展示 MusicXML 格式的乐谱
 * 支持 .xml（MusicXML）和 .mxl（压缩的 MusicXML）格式
 *
 * @example
 * <FullscreenMusicSheet src="flower_dance.xml" title="Flower Dance" />
 * <FullscreenMusicSheet src="flower_dance.mxl" title="Flower Dance" />
 */
export default function FullscreenMusicSheet({
  src,
  zoom = 1.0,
  drawTitle = true,
  drawMeasureNumbers = true,
  title,
}: FullscreenMusicSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)
  const [currentZoom, setCurrentZoom] = useState<number>(zoom)

  // 确保只在客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取 basePath（用于处理子路径部署）
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

  // 解压缩 MXL 文件并提取 MusicXML 内容
  const extractMXL = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const zip = await JSZip.loadAsync(arrayBuffer)

    // MXL 文件标准格式：先读取 META-INF/container.xml 找到根文件
    let rootFilePath = ''

    // 尝试读取 container.xml
    const containerFile = zip.files['META-INF/container.xml']
    if (containerFile) {
      try {
        const containerXml = await containerFile.async('string')
        // 解析 container.xml 找到 rootfile 的 full-path 属性
        const parser = new DOMParser()
        const doc = parser.parseFromString(containerXml, 'text/xml')
        const rootfile = doc.querySelector('rootfile')
        if (rootfile) {
          rootFilePath = rootfile.getAttribute('full-path') || ''
        }
      } catch (err) {
        console.warn('无法解析 container.xml，尝试查找 XML 文件:', err)
      }
    }

    // 如果没有找到 container.xml 或解析失败，查找所有 .xml 文件
    if (!rootFilePath) {
      const xmlFiles = Object.keys(zip.files).filter(
        (name) => name.endsWith('.xml') && !zip.files[name].dir && !name.startsWith('META-INF/')
      )

      if (xmlFiles.length === 0) {
        throw new Error('MXL 文件中未找到 MusicXML 文件')
      }

      // 优先选择包含 "score" 或 "partwise" 的文件名，否则使用第一个
      rootFilePath =
        xmlFiles.find(
          (name) => name.toLowerCase().includes('score') || name.toLowerCase().includes('partwise')
        ) || xmlFiles[0]
    }

    // 提取根文件
    const rootFile = zip.files[rootFilePath]
    if (!rootFile) {
      throw new Error(`MXL 文件中未找到指定的根文件: ${rootFilePath}`)
    }

    const xmlContent = await rootFile.async('string')

    // 验证是否是有效的 MusicXML（包含 partwise 或 score 元素）
    if (!xmlContent.includes('<score-partwise') && !xmlContent.includes('<score-timewise')) {
      throw new Error('提取的文件不是有效的 MusicXML 文件')
    }

    return xmlContent
  }

  // 加载 MusicXML 文件（支持 .xml 和 .mxl 格式）
  const loadMusicXML = async (filePath: string) => {
    if (!osmdInstanceRef.current) {
      setError('OSMD 实例未初始化')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const basePath = getBasePath()
      const isMXL = filePath.toLowerCase().endsWith('.mxl')

      // 尝试多个可能的路径
      const possiblePaths = [
        `${basePath}/musicxml/${filePath}`,
        `/musicxml/${filePath}`,
        `${window.location.origin}${basePath}/musicxml/${filePath}`,
        `${window.location.origin}/musicxml/${filePath}`,
      ]

      let xmlContent = ''
      let xmlPath = ''

      // 依次尝试每个路径
      for (const path of possiblePaths) {
        try {
          const response = await fetch(path)
          if (response.ok) {
            if (isMXL) {
              // MXL 文件：下载并解压缩
              const arrayBuffer = await response.arrayBuffer()
              xmlContent = await extractMXL(arrayBuffer)
              xmlPath = path
              break
            } else {
              // XML 文件：直接读取文本
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
          // 继续尝试下一个路径
        }
      }

      if (!xmlContent) {
        throw new Error(`无法找到或加载 MusicXML 文件: ${filePath}`)
      }

      // 加载 XML 内容
      try {
        // 优先使用 URL 加载（OSMD 可能优化处理）
        if (xmlPath && !isMXL) {
          await osmdInstanceRef.current.load(xmlPath)
        } else {
          // MXL 文件或 URL 加载失败时，使用 XML 字符串
          await osmdInstanceRef.current.load(xmlContent)
        }
      } catch (urlError) {
        // 如果 URL 加载失败，尝试使用 XML 字符串
        console.warn('URL 加载失败，尝试使用 XML 字符串:', urlError)
        await osmdInstanceRef.current.load(xmlContent)
      }

      // 设置缩放
      osmdInstanceRef.current.zoom = currentZoom

      // 渲染乐谱
      osmdInstanceRef.current.render()

      // 确保SVG内容居中
      setTimeout(() => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector('svg')
          if (svg) {
            // 移除可能影响居中的内联样式
            svg.style.removeProperty('left')
            svg.style.removeProperty('right')
            svg.style.removeProperty('transform')
            svg.style.removeProperty('position')

            // 确保SVG居中
            svg.style.margin = '0 auto'
            svg.style.display = 'block'
            svg.style.maxWidth = '100%'

            // 确保容器内容居中
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
      console.error('加载乐谱错误:', err)
      setError(`加载乐谱失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsLoading(false)
    }
  }

  // 初始化 OSMD
  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const initializeOSMD = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 动态导入 OpenSheetMusicDisplay
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
          throw new Error('无法找到 OpenSheetMusicDisplay 类')
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

        // 加载乐谱
        await loadMusicXML(src)
      } catch (err) {
        console.error('OSMD 初始化错误:', err)
        setError(`初始化失败: ${err instanceof Error ? err.message : '未知错误'}`)
        setIsLoading(false)
      }
    }

    // 延迟初始化，确保容器已渲染
    const timer = setTimeout(() => {
      void initializeOSMD()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (osmdInstanceRef.current) {
        osmdInstanceRef.current = null
      }
    }
  }, [mounted, src, drawTitle, drawMeasureNumbers])

  // 当缩放变化时更新
  useEffect(() => {
    if (osmdInstanceRef.current && !isLoading) {
      osmdInstanceRef.current.zoom = currentZoom
      osmdInstanceRef.current.render()

      // 确保SVG内容居中
      setTimeout(() => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector('svg')
          if (svg) {
            // 移除可能影响居中的内联样式
            svg.style.removeProperty('left')
            svg.style.removeProperty('right')
            svg.style.removeProperty('transform')
            svg.style.removeProperty('position')

            // 确保SVG居中
            svg.style.margin = '0 auto'
            svg.style.display = 'block'
            svg.style.maxWidth = '100%'

            // 确保容器内容居中
            containerRef.current.style.textAlign = 'center'
            containerRef.current.style.display = 'flex'
            containerRef.current.style.flexDirection = 'column'
            containerRef.current.style.alignItems = 'center'
            containerRef.current.style.justifyContent = 'flex-start'
          }
        }
      }, 200)
    }
  }, [currentZoom, isLoading])

  // 处理缩放控制
  const handleZoomIn = () => {
    setCurrentZoom((prev) => Math.min(prev + 0.1, 3.0))
  }

  const handleZoomOut = () => {
    setCurrentZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleZoomReset = () => {
    setCurrentZoom(zoom)
  }

  if (!mounted) {
    return null
  }

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="缩小"
            >
              −
            </button>
            <span className="min-w-[60px] text-center text-sm text-gray-600 dark:text-gray-400">
              {Math.round(currentZoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="放大"
            >
              +
            </button>
            <button
              onClick={handleZoomReset}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="重置缩放"
            >
              重置
            </button>
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          返回
        </button>
      </div>

      {/* 乐谱容器 */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500 dark:text-gray-400">正在加载乐谱...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="flex h-full w-full items-start justify-center overflow-auto px-4 py-8">
          <div
            ref={containerRef}
            className={`bg-white p-8 dark:bg-gray-950 ${isLoading || error ? 'hidden' : ''}`}
            style={{
              maxWidth: '95%',
              width: '100%',
            }}
          />
        </div>
      </div>
    </div>
  )

  // 使用 Portal 将组件渲染到 body，确保不受父容器限制
  if (typeof window !== 'undefined') {
    return createPortal(content, document.body)
  }

  return null
}
