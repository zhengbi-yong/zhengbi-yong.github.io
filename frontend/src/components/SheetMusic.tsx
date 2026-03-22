'use client'

import { useEffect, useRef, useState } from 'react'
import abcjs from 'abcjs'

interface SheetMusicProps {
  /** ABC 记谱法字符串 */
  abcnotation: string
  /** 自定义类名 */
  className?: string
  /** 是否显示播放控件 */
  showPlayback?: boolean
}

interface SynthControllerHandle {
  load: (...args: any[]) => void
  setTune: (...args: any[]) => Promise<unknown>
  disable: (isDisabled: boolean) => void
  destroy?: () => void
}

/**
 * SheetMusic - ABC 记谱法乐谱渲染组件
 *
 * 使用纯文本 ABC 记谱法渲染交互式乐谱，支持播放和导出。
 *
 * @example
 * ```tsx
 * <SheetMusic
 *   abcnotation={`X:1
 * T:Cooley's
 * M:4/4
 * K:Em
 * |:D2|EB{c}B A2FD|AGEF E2DB|`}
 * />
 * ```
 */
export default function SheetMusic({
  abcnotation,
  className = '',
  showPlayback = true,
}: SheetMusicProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playbackRef = useRef<HTMLDivElement>(null)
  const synthControllerRef = useRef<SynthControllerHandle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) {
      return undefined
    }

    synthControllerRef.current?.destroy?.()
    synthControllerRef.current?.disable(true)
    synthControllerRef.current = null

    try {
      setError(null)

      // 清空容器
      containerRef.current.innerHTML = ''

      // 渲染乐谱
      const visualObjs = abcjs.renderAbc(containerRef.current, abcnotation, {
        responsive: 'resize',
        scale: 1.2,
        staffwidth: 600,
        paddingtop: 20,
        paddingbottom: 20,
        paddingright: 20,
        paddingleft: 20,
      })

      // 渲染播放控件
      if (showPlayback && playbackRef.current) {
        playbackRef.current.innerHTML = ''
        const visualObj = visualObjs?.[0]

        if (visualObj) {
          const synthController = new abcjs.synth.SynthController() as SynthControllerHandle
          synthController.load(playbackRef.current, undefined, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
          })
          void synthController.setTune(visualObj, false)
          synthControllerRef.current = synthController
        }
      }
    } catch (err) {
      console.error('ABC notation rendering error:', err)
      setError(`渲染失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }

    return () => {
      synthControllerRef.current?.destroy?.()
      synthControllerRef.current?.disable(true)
      synthControllerRef.current = null
    }
  }, [abcnotation, showPlayback, isClient])

  if (!isClient) {
    return (
      <div
        data-testid="sheet-music"
        data-state="loading"
        className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">加载乐谱...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid="sheet-music"
      data-state={error ? 'error' : 'ready'}
      className={`my-6 ${className}`}
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <pre className="mt-2 overflow-auto text-xs text-gray-700 dark:text-gray-300">
            {abcnotation}
          </pre>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <div ref={containerRef} data-testid="sheet-music-score" className="abcjs-sheet" />
          </div>
          {showPlayback && (
            <div
              ref={playbackRef}
              data-testid="sheet-music-playback"
              className="mt-4 text-center"
            />
          )}
        </>
      )}
    </div>
  )
}

/**
 * ABC 代码块包装器 - 用于 MDX 中
 */
export function ABCCodeBlock({
  children,
  className,
}: {
  children?: string | string[] | null
  className?: string
}) {
  // 从代码块中提取 ABC 记谱法
  const abcnotation =
    typeof children === 'string'
      ? children.trim()
      : Array.isArray(children)
        ? children.join('').trim()
        : ''

  if (!abcnotation) {
    return (
      <div className="my-4 rounded border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">空 ABC 代码块</p>
      </div>
    )
  }

  return <SheetMusic abcnotation={abcnotation} className={className} />
}
