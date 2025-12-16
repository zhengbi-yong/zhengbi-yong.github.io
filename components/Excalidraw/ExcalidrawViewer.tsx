'use client'

/**
 * Excalidraw NPM 包集成
 * 使用 @excalidraw/excalidraw npm 包
 *
 * 参考: https://github.com/excalidraw/excalidraw
 */

import Button from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// 动态导入 Excalidraw，避免 SSR 问题
const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw')
      .then((mod) => {
        if (!mod.Excalidraw) {
          throw new Error('Excalidraw component not found in module')
        }
        return {
          default: mod.Excalidraw,
        }
      })
      .catch((error) => {
        throw error
      }),
  {
    ssr: false,
    loading: () => <Loader className="h-96 w-full" />,
  }
)

// Excalidraw 类型定义
type ExcalidrawElement = unknown
type ExcalidrawAppState = unknown
type ExcalidrawFiles = unknown

interface ExcalidrawViewerProps {
  initialData?: {
    elements?: ExcalidrawElement[]
    appState?: ExcalidrawAppState
    files?: ExcalidrawFiles
  }
  onChange?: (elements: ExcalidrawElement[], appState: ExcalidrawAppState) => void
  onSave?: (data: {
    elements: ExcalidrawElement[]
    appState: ExcalidrawAppState
    files: ExcalidrawFiles
  }) => void
  className?: string
  height?: string
  readonly?: boolean
  theme?: 'light' | 'dark'
  showToolbar?: boolean
  showBackButton?: boolean
}

export function ExcalidrawViewer({
  initialData,
  onChange,
  onSave,
  className = '',
  height = '100vh',
  readonly = false,
  theme,
  showToolbar = false,
  showBackButton = false,
}: ExcalidrawViewerProps) {
  const router = useRouter()
  const [excalidrawAPI, setExcalidrawAPI] = useState<unknown>(null)

  useEffect(() => {
    // Component mounted
    return () => {
      // Component unmounted
    }
  }, [])
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(theme || 'light')
  const [viewModeEnabled, setViewModeEnabled] = useState(readonly)
  const [elements, setElements] = useState<ExcalidrawElement[]>(initialData?.elements || [])
  const [appState, setAppState] = useState<ExcalidrawAppState>(initialData?.appState || {})

  // 在客户端动态加载 CSS
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 检查是否已经加载
    const existingLink = document.getElementById('excalidraw-css-link')
    if (existingLink) return

    // 检查是否已经有 Excalidraw 相关的样式
    const hasExcalidrawStyles = Array.from(document.styleSheets).some((sheet) => {
      try {
        return (
          sheet.href &&
          (sheet.href.includes('excalidraw') ||
            sheet.href.includes('unpkg') ||
            sheet.href.includes('jsdelivr'))
        )
      } catch {
        return false
      }
    })

    if (hasExcalidrawStyles) {
      return // 样式已存在
    }

    // 尝试多个 CDN 源
    const cdnSources = [
      'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/index.css',
      'https://unpkg.com/@excalidraw/excalidraw@0.18.0/dist/prod/index.css',
    ]

    const currentIndex = 0

    const tryLoadCSS = (index: number) => {
      if (index >= cdnSources.length) {
        return
      }

      const link = document.createElement('link')
      link.id = 'excalidraw-css-link'
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = cdnSources[index]
      link.crossOrigin = 'anonymous'

      link.onerror = () => {
        // 移除失败的 link
        link.remove()
        // 尝试下一个源
        tryLoadCSS(index + 1)
      }

      document.head.appendChild(link)
    }

    tryLoadCSS(0)

    return () => {
      const linkToRemove = document.getElementById('excalidraw-css-link')
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [])

  // 检测系统主题
  useEffect(() => {
    if (!theme && typeof window !== 'undefined') {
      const html = document.documentElement
      const isDark = html.classList.contains('dark')
      setCurrentTheme(isDark ? 'dark' : 'light')

      // 监听主题变化
      const observer = new MutationObserver(() => {
        const isDark = html.classList.contains('dark')
        setCurrentTheme(isDark ? 'dark' : 'light')
      })

      observer.observe(html, {
        attributes: true,
        attributeFilter: ['class'],
      })

      return () => observer.disconnect()
    }
  }, [theme])

  // 处理变化
  const handleChange = useCallback(
    (elements: ExcalidrawElement[], appState: ExcalidrawAppState) => {
      setElements(elements)
      setAppState(appState)
      onChange?.(elements, appState)
    },
    [onChange]
  )

  // 处理保存
  const handleSave = useCallback(() => {
    if (!excalidrawAPI) return

    // Excalidraw API 类型
    const api = excalidrawAPI as {
      getSceneElements: () => ExcalidrawElement[]
      getAppState: () => ExcalidrawAppState
    }
    const elements = api.getSceneElements()
    const appState = api.getAppState()

    const data = {
      elements,
      appState,
      files: {},
    }

    // 保存到 localStorage
    try {
      localStorage.setItem('excalidraw-latest', JSON.stringify(data))
    } catch (error) {
      console.error('保存失败:', error)
    }

    onSave?.(data)
  }, [excalidrawAPI, onSave])

  // 处理导出 PNG
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPI) return

    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw')
      const api = excalidrawAPI as {
        getSceneElements: () => ExcalidrawElement[]
        getAppState: () => ExcalidrawAppState
      }
      const elements = api.getSceneElements()
      const appState = api.getAppState()

      const blob = await exportToBlob({
        elements,
        appState,
        files: {},
        mimeType: 'image/png',
        getDimensions: (width, height) => ({ width, height }),
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `excalidraw-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出 PNG 失败:', error)
    }
  }, [excalidrawAPI])

  // 处理导出 SVG
  const handleExportSVG = useCallback(async () => {
    if (!excalidrawAPI) return

    try {
      const { exportToSVG } = await import('@excalidraw/excalidraw')
      const api = excalidrawAPI as {
        getSceneElements: () => ExcalidrawElement[]
        getAppState: () => ExcalidrawAppState
      }
      const elements = api.getSceneElements()
      const appState = api.getAppState()

      const svgString = await exportToSVG({
        elements,
        appState,
        files: {},
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `excalidraw-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出 SVG 失败:', error)
    }
  }, [excalidrawAPI])

  // 加载最新保存的绘图
  useEffect(() => {
    if (!initialData && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('excalidraw-latest')
        if (saved) {
          const data = JSON.parse(saved)
          if (data.elements && data.elements.length > 0) {
            setElements(data.elements)
            setAppState(data.appState)
            // 等待 API 准备好后更新场景
            if (excalidrawAPI) {
              const api = excalidrawAPI as {
                updateScene: (data: {
                  elements: ExcalidrawElement[]
                  appState: ExcalidrawAppState
                }) => void
              }
              api.updateScene({
                elements: data.elements,
                appState: data.appState,
              })
            }
          }
        }
      } catch (error) {
        console.error('加载保存的绘图失败:', error)
      }
    }
  }, [initialData, excalidrawAPI])

  // 当 API 准备好且有待加载的数据时，更新场景
  useEffect(() => {
    if (excalidrawAPI && initialData && initialData.elements) {
      const api = excalidrawAPI as {
        updateScene: (data: { elements: ExcalidrawElement[]; appState: ExcalidrawAppState }) => void
      }
      api.updateScene({
        elements: initialData.elements,
        appState: initialData.appState || {},
      })
    }
  }, [excalidrawAPI, initialData])

  return (
    <div
      className={`${className} h-screen w-full`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        zIndex: 9999,
      }}
    >
      {/* 返回按钮 - 固定在左上角 */}
      {showBackButton && (
        <Button
          onClick={() => router.back()}
          size="xs"
          variant="outline"
          className="absolute top-4 left-12 z-[99999] bg-white/90 px-2 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
          aria-label="返回"
        >
          返回
        </Button>
      )}

      {/* 工具栏 */}
      {showToolbar && (
        <div className="flex gap-2 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <Button onClick={handleSave} size="sm">
            保存
          </Button>
          <Button onClick={handleExportPNG} size="sm" variant="outline">
            导出 PNG
          </Button>
          <Button onClick={handleExportSVG} size="sm" variant="outline">
            导出 SVG
          </Button>
          <Button onClick={() => setViewModeEnabled(!viewModeEnabled)} size="sm" variant="outline">
            {viewModeEnabled ? '编辑模式' : '查看模式'}
          </Button>
        </div>
      )}
      <div
        style={{
          flex: '1 1 0%',
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '0',
          overflow: 'hidden',
        }}
        className="excalidraw-wrapper"
      >
        <Excalidraw
          excalidrawAPI={(api: unknown) => {
            if (api) {
              setExcalidrawAPI(api)
            }
          }}
          initialData={initialData || { elements: [], appState: {} }}
          onChange={handleChange}
          viewModeEnabled={viewModeEnabled}
          theme={currentTheme}
          name="新绘图"
        />
      </div>
    </div>
  )
}
