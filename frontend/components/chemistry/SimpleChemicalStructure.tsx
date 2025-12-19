'use client'

import { useEffect, useRef, useState } from 'react'

interface SimpleChemicalStructureProps {
  /** 结构文件路径（相对于public目录） */
  file?: string
  /** 内联结构数据（字符串格式） */
  data?: string
  /** 文件格式 */
  format?: 'pdb' | 'sdf' | 'xyz' | 'mol' | 'cif'
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 显示样式 */
  style?: 'stick' | 'cartoon' | 'sphere' | 'surface' | 'line'
  /** 背景色 */
  backgroundColor?: string
  /** 自定义类名 */
  className?: string
  /** 是否自动旋转 */
  autoRotate?: boolean
}

/**
 * SimpleChemicalStructure - 简化版3D化学结构可视化组件
 * 使用CDN加载3Dmol.js
 */
export default function SimpleChemicalStructure({
  file,
  data,
  format = 'pdb',
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
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  // 移除所有动画相关的ref，只保留viewer引用

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    const initViewer = async () => {
      try {
        // 确保已经加载了3Dmol.js
        if (typeof window === 'undefined' || !(window as any).$3Dmol) {
          // 动态加载3Dmol.js
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/3dmol@2.5.3/build/3Dmol-min.js'
          script.async = true

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        const $3Dmol = (window as any).$3Dmol
        if (!$3Dmol) {
          throw new Error('3Dmol.js 加载失败')
        }

        // 创建viewer - 确保容器有正确的尺寸
        const container = containerRef.current
        if (!container) return

        // 设置容器的最小尺寸以确保3Dmol能正确渲染
        const containerWidth = typeof width === 'number' ? width : container.offsetWidth
        const containerHeight = typeof height === 'number' ? height : 400

        // 确保容器样式正确
        container.style.width = typeof width === 'number' ? `${width}px` : width
        container.style.height = typeof height === 'number' ? `${height}px` : height
        container.style.position = 'relative'
        container.style.overflow = 'hidden'

        const viewer = $3Dmol.createViewer(container, {
          defaultcolors: $3Dmol.rasmolElementColors,
          backgroundColor:
            backgroundColor ||
            (document.documentElement.classList.contains('dark') ? 0x1a1a1a : 0xffffff),
        })

        viewerRef.current = viewer

        // 加载结构数据
        try {
          if (file) {
            // 从文件加载
            const filePath = file.startsWith('/') ? file : `/${file}`
            const response = await fetch(filePath)
            if (!response.ok) {
              throw new Error(`无法加载文件: ${filePath}`)
            }
            const fileData = await response.text()
            viewer.addModel(fileData, format)
          } else if (data) {
            // 从内联数据加载
            viewer.addModel(data, format)
          } else {
            throw new Error('必须提供file或data属性')
          }

          // 设置样式
          viewer.setStyle({}, { [style]: {} })

          // 渲染
          viewer.zoomTo()
          viewer.render()
          viewer.zoom(0.8, 1000)

          setIsLoading(false)

          // 3Dmol.js 默认支持鼠标交互（拖拽旋转、滚轮缩放）
          // 不需要额外的自动旋转代码
        } catch (err) {
          console.error('加载结构失败:', err)
          const errorMsg = `加载结构失败: ${err instanceof Error ? err.message : '未知错误'}`
          setError(errorMsg)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('初始化viewer失败:', err)
        const errorMsg = `初始化viewer失败: ${err instanceof Error ? err.message : '未知错误'}`
        setError(errorMsg)
        setIsLoading(false)
      }
    }

    initViewer()

    // 清理函数
    return () => {
      // 清理viewer
      if (viewerRef.current) {
        try {
          if (typeof viewerRef.current.clear === 'function') {
            viewerRef.current.clear()
          }
          if (typeof viewerRef.current.destroy === 'function') {
            viewerRef.current.destroy()
          }
        } catch (error) {
          console.warn('清理viewer时出错:', error)
        }
        viewerRef.current = null
      }
    }
  }, [isClient, file, data, format, style, backgroundColor, autoRotate, width, height])

  // 处理窗口大小变化
  useEffect(() => {
    if (!viewerRef.current) return

    const handleResize = () => {
      if (viewerRef.current && containerRef.current) {
        viewerRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 处理主题变化
  useEffect(() => {
    if (!viewerRef.current) return

    const observer = new MutationObserver(() => {
      if (viewerRef.current) {
        const isDark = document.documentElement.classList.contains('dark')
        viewerRef.current.setBackgroundColor(isDark ? 0x1a1a1a : 0xffffff)
        viewerRef.current.render()
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  if (!isClient) {
    return (
      <div
        className={`my-6 flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
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
        className={`my-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}
        style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className={`my-6 ${className}`}>
      <div
        ref={containerRef}
        className="rounded-lg border border-gray-200 dark:border-gray-700"
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  )
}
