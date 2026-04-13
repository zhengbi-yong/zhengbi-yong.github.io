'use client'

/**
 * Excalidraw NPM 包集成
 * 使用 @excalidraw/excalidraw npm 包
 *
 * 参考: https://github.com/excalidraw/excalidraw
 */

import { Button } from '@/components/shadcn/ui/button'
import { Loader } from '@/components/ui/Loader'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { logger } from '@/lib/utils/logger'

// 添加 CSS 动画样式
const fadeInOutStyle = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-20px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
`

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

// 简化类型定义以避免类型冲突
type ExcalidrawElement = any
type ExcalidrawAppState = any
type BinaryFiles = any
type ExcalidrawFiles = any

interface ExcalidrawViewerProps {
  initialData?: any
  onChange?: (elements: any, appState: any, files: any) => void
  onSave?: (data: any) => void
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
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 添加动画样式到文档
    if (typeof window !== 'undefined' && !document.getElementById('excalidraw-animation-styles')) {
      const style = document.createElement('style')
      style.id = 'excalidraw-animation-styles'
      style.textContent = fadeInOutStyle
      document.head.appendChild(style)
    }

    return () => {
      // Component unmounted
      const styleToRemove = document.getElementById('excalidraw-animation-styles')
      if (styleToRemove) {
        styleToRemove.remove()
      }
    }
  }, [])
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(theme || 'light')
  const [viewModeEnabled, setViewModeEnabled] = useState(readonly)
  const [elements, setElements] = useState<ExcalidrawElement[]>(initialData?.elements || [])
  const [appState, setAppState] = useState<ExcalidrawAppState>(initialData?.appState || {})

  // 在客户端动态加载 CSS
  useEffect(() => {
    if (typeof window === 'undefined') { return undefined; }

    // 检查是否已经加载
    const existingLink = document.getElementById('excalidraw-css-link')
    if (existingLink) { return undefined; }

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
      return undefined; // 样式已存在
    }

    // 尝试多个 CDN 源
    const cdnSources = [
      'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/index.css',
      'https://unpkg.com/@excalidraw/excalidraw@0.18.0/dist/prod/index.css',
    ]

    // currentIndex removed unused

    const tryLoadCSS = (index: number) => {
      if (index >= cdnSources.length) {
  return undefined
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
    return undefined
  }, [theme])

  // 处理变化
  const handleChange = useCallback(
    (elements: any, appState: any, files: any) => {
      setElements(elements)
      setAppState(appState)
      onChange?.(elements, appState, files)
    },
    [onChange]
  )

  // 处理保存 - 兼容 onSave 回调和内置保存按钮
  const handleSave = useCallback(
    async (elements?: ExcalidrawElement[], appState?: ExcalidrawAppState, files?: BinaryFiles) => {
      // 如果通过 onSave 回调触发，使用传入的参数
      // 否则通过 API 获取当前数据
      let elementsToSave = elements
      let appStateToSave = appState
      let filesToSave = files

      if (!elementsToSave && excalidrawAPI) {
        const api = excalidrawAPI as {
          getSceneElements: () => ExcalidrawElement[]
          getAppState: () => ExcalidrawAppState
          getFiles: () => BinaryFiles
        }
        elementsToSave = api.getSceneElements()
        appStateToSave = api.getAppState()
        filesToSave = api.getFiles ? api.getFiles() : {}
      }

      if (!elementsToSave) return

      setIsLoading(true)
      try {
        const data = {
          elements: elementsToSave,
          appState: appStateToSave || {},
          files: filesToSave || {},
        }

        // 保存到 localStorage
        localStorage.setItem('excalidraw-latest', JSON.stringify(data))

        // 显示保存成功提示
        logger.log('保存成功:', {
          elementsCount: elementsToSave.length,
          hasAppState: !!appStateToSave,
        })

        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.textContent = '✓ 保存成功'
        successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 2000)

        onSave?.(data)
      } catch (error) {
        logger.error('保存失败:', error)
        alert('保存失败，请重试')
      } finally {
        setIsLoading(false)
      }
    },
    [excalidrawAPI, onSave]
  )

  // 处理导出 PNG - 支持参数或 API 获取数据
  const handleExportPNG = useCallback(
    async (
      elements?: ExcalidrawElement[],
      appState?: ExcalidrawAppState,
      files?: ExcalidrawFiles
    ) => {
      let elementsToExport = elements
      let appStateToExport = appState

      if (!elementsToExport && excalidrawAPI) {
        const api = excalidrawAPI as {
          getSceneElements: () => ExcalidrawElement[]
          getAppState: () => ExcalidrawAppState
        }
        elementsToExport = api.getSceneElements()
        appStateToExport = api.getAppState()
      }

      if (!elementsToExport) return

      setIsLoading(true)
      try {
        logger.log('开始导出 PNG，元素数量:', elementsToExport.length)

        // 使用正确的 exportToBlob API
        const { exportToBlob } = await import('@excalidraw/excalidraw')

        const blob = await exportToBlob({
          elements: elementsToExport,
          appState: {
            ...(appStateToExport || {}),
            exportBackground: true,
            viewBackgroundColor:
              (appStateToExport as any)?.viewBackgroundColor ||
              (currentTheme === 'dark' ? '#1a1a1a' : '#ffffff'),
          } as any,
          files: files || ({} as ExcalidrawFiles),
          mimeType: 'image/png',
          exportPadding: 10,
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `excalidraw-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        logger.log('PNG 导出成功，文件大小:', blob.size)

        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.textContent = '✓ PNG 导出成功'
        successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 2000)
      } catch (error) {
        logger.error('导出 PNG 失败:', error)
        alert('导出 PNG 失败: ' + (error instanceof Error ? error.message : String(error)))
      } finally {
        setIsLoading(false)
      }
    },
    [excalidrawAPI, currentTheme]
  )

  // 处理导出 SVG - 支持参数或 API 获取数据
  const handleExportSVG = useCallback(
    async (
      elements?: ExcalidrawElement[],
      appState?: ExcalidrawAppState,
      files?: ExcalidrawFiles
    ) => {
      let elementsToExport = elements
      let appStateToExport = appState

      if (!elementsToExport && excalidrawAPI) {
        const api = excalidrawAPI as {
          getSceneElements: () => ExcalidrawElement[]
          getAppState: () => ExcalidrawAppState
        }
        elementsToExport = api.getSceneElements()
        appStateToExport = api.getAppState()
      }

      if (!elementsToExport) return

      setIsLoading(true)
      try {
        // 正确的 API 调用方式
        const { exportToSvg } = await import('@excalidraw/excalidraw')

        logger.log('开始导出 SVG，元素数量:', elementsToExport.length)

        // 使用正确的参数格式 - 对象格式
        const svgElement = await exportToSvg({
          elements: elementsToExport,
          appState: {
            ...(appStateToExport || {}),
            exportBackground: true,
            viewBackgroundColor:
              (appStateToExport as any)?.viewBackgroundColor ||
              (currentTheme === 'dark' ? '#1a1a1a' : '#ffffff'),
          } as any,
          files: files || ({} as ExcalidrawFiles),
          exportPadding: 10,
        })

        // 将 SVG 元素转换为字符串
        const svgString = new XMLSerializer().serializeToString(svgElement)
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `excalidraw-${Date.now()}.svg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        logger.log('SVG 导出成功，SVG 长度:', svgString.length)

        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.textContent = '✓ SVG 导出成功'
        successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 2000)
      } catch (error) {
        logger.error('导出 SVG 失败:', error)
        alert('导出 SVG 失败: ' + (error instanceof Error ? error.message : String(error)))
      } finally {
        setIsLoading(false)
      }
    },
    [excalidrawAPI, currentTheme]
  )

  // 处理导出 JSON - 导出完整的绘图数据
  const handleExportJSON = useCallback(
    async (
      elements?: ExcalidrawElement[],
      appState?: ExcalidrawAppState,
      files?: ExcalidrawFiles
    ) => {
      let elementsToExport = elements
      let appStateToExport = appState

      if (!elementsToExport && excalidrawAPI) {
        const api = excalidrawAPI as {
          getSceneElements: () => ExcalidrawElement[]
          getAppState: () => ExcalidrawAppState
          getFiles: () => ExcalidrawFiles
        }
        elementsToExport = api.getSceneElements()
        appStateToExport = api.getAppState()
      }

      if (!elementsToExport) return

      setIsLoading(true)
      try {
        logger.log('开始导出 JSON，元素数量:', elementsToExport.length)

        const api = excalidrawAPI as {
          getFiles: () => ExcalidrawFiles
        }

        const exportData = {
          type: 'excalidraw',
          version: 2,
          source: 'https://excalidraw.com',
          elements: elementsToExport,
          appState: appStateToExport,
          files: files || (api?.getFiles ? api.getFiles() : {}),
          metadata: {
            exportDate: new Date().toISOString(),
            exportSource: 'Zhengbi Yong Blog',
          },
        }

        const json = JSON.stringify(exportData, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `excalidraw-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        logger.log('JSON 导出成功，数据大小:', json.length)

        // 显示成功消息
        const successMessage = document.createElement('div')
        successMessage.textContent = '✓ JSON 导出成功'
        successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 2000)
      } catch (error) {
        logger.error('导出 JSON 失败:', error)
        alert('导出 JSON 失败: ' + (error instanceof Error ? error.message : String(error)))
      } finally {
        setIsLoading(false)
      }
    },
    [excalidrawAPI]
  )

  // 添加键盘快捷键支持
  useEffect(() => {
    if (typeof window === 'undefined') { return undefined; }

  const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下了 Ctrl 或 Cmd
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // 检查是否在输入框中，如果是则不触发快捷键
      const target = event.target as HTMLElement
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'

      if (isInputElement) return

      // Ctrl/Cmd + S: 保存
      if (isCtrlOrCmd && event.key === 's') {
        event.preventDefault()
        handleSave()
        return
      }

      // Ctrl/Cmd + Shift + E: 导出 PNG
      if (isCtrlOrCmd && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        handleExportPNG()
        return
      }

      // Ctrl/Cmd + Shift + S: 导出 SVG
      if (isCtrlOrCmd && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        handleExportSVG()
        return
      }

      // Ctrl/Cmd + Shift + J: 导出 JSON
      if (isCtrlOrCmd && event.shiftKey && event.key === 'J') {
        event.preventDefault()
        handleExportJSON()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleExportPNG, handleExportSVG, handleExportJSON])

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
        logger.error('加载保存的绘图失败:', error)
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
      className={`${className} w-full`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      height: height ?? '100vh',
      display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      zIndex: 9999,
      }}
      data-elements={elements?.length ?? 0}
      data-appstate={JSON.stringify(appState || {})}
    >
      {/* 顶部工具栏 */}
      {(showToolbar || showBackButton) && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex gap-2">
            {/* 返回按钮 */}
            {showBackButton && (
              <Button
                onClick={() => router.back()}
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                返回
              </Button>
            )}

            {/* 操作按钮 */}
            {showToolbar && (
              <>
                <Button onClick={() => handleSave()} size="sm" disabled={isLoading}>
                  {isLoading ? '保存中...' : '保存'}
                </Button>
                <Button
                  onClick={() => handleExportPNG()}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? '导出中...' : '导出 PNG'}
                </Button>
                <Button
                  onClick={() => handleExportSVG()}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? '导出中...' : '导出 SVG'}
                </Button>
                <Button
                  onClick={() => setViewModeEnabled(!viewModeEnabled)}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  {viewModeEnabled ? '编辑模式' : '查看模式'}
                </Button>
              </>
            )}
          </div>

          {/* 右侧留空或可以添加其他功能 */}
          <div className="flex gap-2">{/* 可以在这里添加其他功能按钮 */}</div>
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
              logger.log('Excalidraw API 初始化成功:', api)
              setExcalidrawAPI(api)
            } else {
              logger.log('Excalidraw API 初始化失败')
            }
          }}
          initialData={initialData}
          onChange={handleChange}
          viewModeEnabled={viewModeEnabled}
          theme={currentTheme}
          name="新绘图"
          // 配置 UI 选项和自定义动作
          // 移除UIOptions以避免类型错误
        />
      </div>
    </div>
  )
}
