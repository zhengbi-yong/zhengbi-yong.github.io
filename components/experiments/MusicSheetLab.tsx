'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/components/ui/button'
import { Spinner } from '@/components/loaders'
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

// 定义示例文件列表
const exampleFiles = [
  { fileName: 'simple-example.xml', displayName: '简单示例' },
  { fileName: 'multi-part-example.xml', displayName: '多声部示例' },
]

export default function MusicSheetLab() {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [currentExample, setCurrentExample] = useState<string>(exampleFiles[0].fileName)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)

  // 确保只在客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 加载 MusicXML 文件
  const loadMusicXML = async (fileName: string) => {
    if (!osmdInstanceRef.current) {
      console.error('OSMD 实例不存在，无法加载乐谱')
      setError('OSMD 实例未初始化')
      setIsLoading(false)
      if (containerRef.current) {
        containerRef.current.classList.add('hidden')
      }
      return
    }

    setIsLoading(true)
    setError(null)

    // 确保容器可见
    if (containerRef.current) {
      containerRef.current.classList.remove('hidden')
    }

    try {
      const xmlPath = `/musicxml/${fileName}`
      console.log('正在加载 MusicXML 文件:', xmlPath)
      
      // 先检查文件是否存在
      const response = await fetch(xmlPath)
      if (!response.ok) {
        throw new Error(`文件加载失败: ${response.status} ${response.statusText}`)
      }
      
      await osmdInstanceRef.current.load(xmlPath)
      console.log('MusicXML 加载成功，开始渲染...')
      osmdInstanceRef.current.render()
      console.log('乐谱渲染完成')
      setIsLoading(false)
    } catch (err) {
      console.error('加载乐谱错误:', err)
      setError(`加载乐谱失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsLoading(false)
      // 发生错误时隐藏容器
      if (containerRef.current) {
        containerRef.current.classList.add('hidden')
      }
    }
  }

  // 初始化 OSMD - 只在客户端挂载后执行
  useEffect(() => {
    if (!mounted) return

    // 确保容器存在后再初始化
    const initTimer = setTimeout(() => {
      if (containerRef.current) {
        void initializeOSMD()
      } else {
        // 如果容器仍然不存在，设置错误
        setError('容器元素未准备好')
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(initTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // OSMD 初始化函数
  const initializeOSMD = async () => {
    if (!containerRef.current) {
      setError('容器元素未准备好')
      setIsLoading(false)
      return
    }

    // 确保容器可见（移除 hidden class）
    containerRef.current.classList.remove('hidden')

    try {
      setIsLoading(true)
      setError(null)

      // 动态导入 OpenSheetMusicDisplay
      // OSMD 是一个 UMD 模块，可能需要特殊处理
      const OSMDModule = await import('opensheetmusicdisplay')
      
      console.log('OSMD 模块加载成功，模块结构:', Object.keys(OSMDModule))
      
      // OSMD 可能以多种方式导出，尝试不同的导入方式
      let OpenSheetMusicDisplayClass: any = null
      
      // 方式1: 直接导出
      if (OSMDModule.OpenSheetMusicDisplay) {
        OpenSheetMusicDisplayClass = OSMDModule.OpenSheetMusicDisplay
        console.log('使用方式1: OSMDModule.OpenSheetMusicDisplay')
      }
      // 方式2: default 导出
      else if ((OSMDModule as any).default) {
        const defaultExport = (OSMDModule as any).default
        if (defaultExport.OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = defaultExport.OpenSheetMusicDisplay
          console.log('使用方式2: default.OpenSheetMusicDisplay')
        } else if (typeof defaultExport === 'function') {
          OpenSheetMusicDisplayClass = defaultExport
          console.log('使用方式3: default 作为函数')
        } else if (defaultExport.OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = defaultExport.OpenSheetMusicDisplay
          console.log('使用方式4: default.OpenSheetMusicDisplay (嵌套)')
        }
      }
      // 方式3: 检查全局变量（UMD 模块可能挂载到 window）
      else if (typeof window !== 'undefined' && (window as any).OpenSheetMusicDisplay) {
        OpenSheetMusicDisplayClass = (window as any).OpenSheetMusicDisplay
        console.log('使用方式5: window.OpenSheetMusicDisplay')
      }
      
      if (!OpenSheetMusicDisplayClass) {
        console.error('OSMD 模块完整结构:', OSMDModule)
        throw new Error('无法找到 OpenSheetMusicDisplay 类。请检查浏览器控制台查看模块结构。')
      }

      console.log('正在初始化 OSMD，容器:', containerRef.current)
      const osmd = new OpenSheetMusicDisplayClass(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawLyricist: true,
        drawPartNames: true,
        drawMeasureNumbers: true,
        drawTimeSignatures: true,
      })
      
      osmdInstanceRef.current = osmd
      console.log('OSMD 实例创建成功:', osmd)
      await loadMusicXML(currentExample)
    } catch (err) {
      console.error('OSMD 初始化错误详情:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`初始化失败: ${errorMessage}`)
      setIsLoading(false)
      // 发生错误时隐藏容器
      if (containerRef.current) {
        containerRef.current.classList.add('hidden')
      }
    }
  }

  // 处理示例切换
  const handleExampleChange = (fileName: string) => {
    setCurrentExample(fileName)
    void loadMusicXML(fileName)
  }

  // 处理缩放变化
  const handleZoomChange = (value: number) => {
    setZoomLevel(value)
    if (osmdInstanceRef.current) {
      osmdInstanceRef.current.zoom = value
      osmdInstanceRef.current.render()
    }
  }

  // 处理页面导航（如果支持）
  const handlePageNext = () => {
    if (osmdInstanceRef.current?.cursor) {
      try {
        osmdInstanceRef.current.cursor.next()
        osmdInstanceRef.current.render()
      } catch (err) {
        // 如果 cursor API 不可用，忽略错误
        console.warn('页面导航不可用:', err)
      }
    }
  }

  const handlePagePrevious = () => {
    if (osmdInstanceRef.current?.cursor) {
      try {
        osmdInstanceRef.current.cursor.previous()
        osmdInstanceRef.current.render()
      } catch (err) {
        // 如果 cursor API 不可用，忽略错误
        console.warn('页面导航不可用:', err)
      }
    }
  }

  // 清理函数
  useEffect(() => {
    return () => {
      // OSMD 会在容器移除时自动清理
      osmdInstanceRef.current = null
    }
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        使用 OpenSheetMusicDisplay 渲染 MusicXML 乐谱，支持缩放、页面导航和示例切换。
      </p>

      {/* 控制面板 */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 md:flex-row md:items-center md:justify-between">
        {/* 示例选择 */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label htmlFor="example-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            选择示例：
          </label>
          <select
            id="example-select"
            value={currentExample}
            onChange={(e) => handleExampleChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-400"
          >
            {exampleFiles.map((file) => (
              <option key={file.fileName} value={file.fileName}>
                {file.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* 缩放控制 */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label htmlFor="zoom-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            缩放：
          </label>
          <div className="flex items-center gap-3">
            <input
              id="zoom-slider"
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="h-2 w-32 cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
            />
            <span className="min-w-[3rem] text-sm text-gray-600 dark:text-gray-400">
              {zoomLevel.toFixed(1)}x
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(1.0)}
                className="h-7 px-2 text-xs"
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* 页面导航 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePagePrevious}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePageNext}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            下一页
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && mounted && (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 dark:text-gray-400">正在加载乐谱...</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoading && mounted && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMusicXML(currentExample)}
            className="mt-3"
          >
            重试
          </Button>
        </div>
      )}

      {/* OSMD 容器 - 只在客户端挂载后渲染，避免 hydration 错误 */}
      {mounted && (
        <div
          ref={containerRef}
          className="min-h-[400px] rounded-2xl border border-dashed border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50 hidden"
        />
      )}
    </div>
  )
}

