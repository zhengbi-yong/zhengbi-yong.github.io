'use client'

import { useEffect, useRef, useState } from 'react'

interface ChemicalStructureProps {
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
 * ChemicalStructure - 3D化学结构可视化组件
 * 使用3Dmol.js渲染分子和晶体结构
 */
export default function ChemicalStructure({
  file,
  data,
  format = 'pdb',
  width = '100%',
  height = 400,
  style = 'stick',
  backgroundColor,
  className = '',
  autoRotate = false,
}: ChemicalStructureProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // 移除所有动画相关的ref，只保留viewer引用

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    const initViewer = async () => {
      try {
        if (!containerRef.current) return

        // 加载3Dmol库
        let $3Dmol: any

        // 首先尝试从npm包导入
        try {
          $3Dmol = await import('3dmol')
          // 确保全局可访问
          if (typeof window !== 'undefined') {
            ;(window as any).$3Dmol = $3Dmol
          }
        } catch (importError) {
          // 如果npm包导入失败，尝试从CDN加载
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/3dmol@2.5.3/build/3Dmol-min.js'

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })

          $3Dmol = (window as any).$3Dmol
        }

        // 确保容器样式正确
        const container = containerRef.current
        container.style.width = typeof width === 'number' ? `${width}px` : width
        container.style.height = typeof height === 'number' ? `${height}px` : height
        container.style.position = 'relative'
        container.style.overflow = 'hidden'

        // 创建viewer
        const viewer = $3Dmol.createViewer(container, {
          defaultcolors: $3Dmol.rasmolElementColors,
          backgroundColor: backgroundColor || 0xffffff,
        })

        viewerRef.current = viewer

        // 设置背景色
        if (backgroundColor) {
          viewer.setBackgroundColor(backgroundColor)
        } else {
          // 根据主题设置背景色
          const isDark = document.documentElement.classList.contains('dark')
          viewer.setBackgroundColor(isDark ? 0x1a1a1a : 0xffffff)
        }

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
