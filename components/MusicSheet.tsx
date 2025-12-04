'use client'

import { useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/loaders'
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

interface MusicSheetProps {
  /** MusicXML 文件路径，相对于 public/musicxml/ 目录 */
  src: string
  /** 缩放级别，默认 1.0 */
  zoom?: number
  /** 是否显示标题等信息，默认 true */
  drawTitle?: boolean
  /** 是否显示小节号，默认 true */
  drawMeasureNumbers?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 乐谱组件 - 用于在 MDX 文章中显示 MusicXML 格式的乐谱
 * 
 * @example
 * <MusicSheet src="simple-example.xml" zoom={1.2} />
 */
export default function MusicSheet({
  src,
  zoom = 1.0,
  drawTitle = true,
  drawMeasureNumbers = true,
  className = '',
}: MusicSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)

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
    const knownAppRoutes = ['experiment', 'blog', 'tags', 'about', 'projects']
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

  // 加载 MusicXML 文件
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
            const contentType = response.headers.get('content-type') || ''
            if (contentType.includes('xml') || contentType.includes('text')) {
              xmlContent = await response.text()
              if (xmlContent.trim().startsWith('<?xml')) {
                xmlPath = path
                break
              }
            }
          }
        } catch {
          // 继续尝试下一个路径
        }
      }
      
      if (!xmlContent || !xmlPath) {
        throw new Error(`无法找到或加载 MusicXML 文件: ${filePath}`)
      }
      
      // 加载 XML 内容
      try {
        await osmdInstanceRef.current.load(xmlPath)
      } catch (urlError) {
        // 如果 URL 加载失败，尝试使用 XML 字符串
        console.warn('URL 加载失败，尝试使用 XML 字符串:', urlError)
        await osmdInstanceRef.current.load(xmlContent)
      }
      
      // 设置缩放
      osmdInstanceRef.current.zoom = zoom
      
      // 渲染乐谱
      osmdInstanceRef.current.render()
      
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
  }, [mounted, src, zoom, drawTitle, drawMeasureNumbers])

  // 当 zoom 变化时更新缩放
  useEffect(() => {
    if (osmdInstanceRef.current && !isLoading) {
      osmdInstanceRef.current.zoom = zoom
      osmdInstanceRef.current.render()
    }
  }, [zoom, isLoading])

  if (!mounted) {
    return null
  }

  return (
    <div className={`my-6 ${className}`}>
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 dark:text-gray-400">正在加载乐谱...</p>
          </div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50 ${
          isLoading || error ? 'hidden' : ''
        }`}
      />
    </div>
  )
}

