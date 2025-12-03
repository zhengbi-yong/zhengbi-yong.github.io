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
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackProgress, setPlaybackProgress] = useState<number>(0)
  
  // 播放相关引用
  const synthRef = useRef<any>(null)
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const notesSequenceRef = useRef<Array<{ time: number; notes: any[] }>>([])
  const startTimeRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)
  const bpmRef = useRef<number>(120)

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
      
      // 解析音符序列用于播放
      await parseNotesForPlayback()
      
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
      
      // 初始化光标（用于播放时的高亮显示）
      if (osmd.cursor) {
        osmd.cursor.hide()
      }
      
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

  // 解析音符序列用于播放
  const parseNotesForPlayback = async () => {
    if (!osmdInstanceRef.current) return

    try {
      const osmd = osmdInstanceRef.current
      const notes: Array<{ time: number; notes: Array<{ pitch: string; duration: number }> }> = []
      
      // 使用 cursor 遍历所有音符
      if (osmd.cursor && osmd.cursor.iterator) {
        // 使用 Cursor 的 resetIterator 方法重置迭代器
        osmd.cursor.resetIterator()
        const iterator = osmd.cursor.iterator
        
        // 尝试从乐谱获取 BPM，如果没有则使用默认值
        let bpm = 120
        try {
          const currentBpm = iterator.CurrentBpm
          if (currentBpm && currentBpm > 0) {
            bpm = currentBpm
          }
        } catch (err) {
          console.warn('无法获取 BPM，使用默认值 120')
        }
        
        bpmRef.current = bpm
        console.log('使用 BPM:', bpm)
        
        // 遍历所有音符
        while (!iterator.EndReached) {
          const voiceEntries = iterator.CurrentVoiceEntries
          const timestamp = iterator.CurrentSourceTimestamp
          
          // 获取当前时间戳对应的秒数
          // OSMD 使用 Fraction 表示时间，需要转换为秒
          // RealValue 是相对于全音符的分数值
          // 假设 4/4 拍，一个全音符 = 4 拍 = 60/bpm * 4 秒
          const timeInSeconds = timestamp.RealValue * (60 / bpm) * 4
          
          const notesAtTime: Array<{ pitch: string; duration: number }> = []
          
          for (const voiceEntry of voiceEntries) {
            for (const note of voiceEntry.Notes) {
              if (!note.isRest()) {
                try {
                  // 将半音数转换为音名（如 C4, D4）
                  const halfTone = note.halfTone
                  // 半音数从 C-1 (MIDI 0) 开始，C4 (MIDI 60) 是中央 C
                  // 计算八度和音名索引
                  const octave = Math.floor((halfTone + 12) / 12) - 1
                  const noteIndex = ((halfTone % 12) + 12) % 12
                  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                  const pitch = `${noteNames[noteIndex]}${octave}`
                  
                  // 获取音符时值（转换为秒）
                  // RealValue 是相对于全音符的分数，需要根据 BPM 转换
                  const duration = note.Length.RealValue * (60 / bpm) * 4
                  
                  if (duration > 0 && pitch) {
                    notesAtTime.push({ pitch, duration })
                  }
                } catch (err) {
                  console.warn('解析音符失败:', err, note)
                }
              }
            }
          }
          
          if (notesAtTime.length > 0) {
            notes.push({ time: timeInSeconds, notes: notesAtTime })
          }
          
          // 使用 iterator 的 moveToNext 方法移动到下一个位置
          iterator.moveToNext()
        }
      }
      
      notesSequenceRef.current = notes
      console.log('解析完成，音符数量:', notes.length)
      if (notes.length > 0) {
        console.log('前几个音符示例:', notes.slice(0, 3))
      } else {
        console.warn('警告：没有解析到任何音符！')
      }
    } catch (err) {
      console.error('解析音符失败:', err)
    }
  }

  // 初始化 Tone.js
  const initializeTone = async () => {
    if (synthRef.current) return synthRef.current

    try {
      const Tone = await import('tone')
      await Tone.start()
      
      // 创建合成器
      const synth = new Tone.PolySynth(Tone.Synth).toDestination()
      synthRef.current = synth
      
      return synth
    } catch (err) {
      console.error('Tone.js 初始化失败:', err)
      throw err
    }
  }

  // 播放乐谱
  const handlePlay = async () => {
    if (!osmdInstanceRef.current) return

    try {
      if (isPlaying) {
        // 暂停播放
        handleStop()
        return
      }

      // 初始化 Tone.js
      const Tone = await import('tone')
      await Tone.start()
      const synth = await initializeTone()
      
      // 确保音符已解析
      if (notesSequenceRef.current.length === 0) {
        await parseNotesForPlayback()
      }

      const allNotes = notesSequenceRef.current
      if (allNotes.length === 0) {
        throw new Error('没有可播放的音符')
      }

      // 重置光标
      if (osmdInstanceRef.current.cursor) {
        osmdInstanceRef.current.cursor.reset()
        osmdInstanceRef.current.cursor.show()
      }

      setIsPlaying(true)
      isPlayingRef.current = true
      setPlaybackProgress(0)

      console.log('开始播放，音符序列:', allNotes.slice(0, 5))

      // 使用 Tone.Transport 来精确控制时间
      Tone.Transport.cancel()
      Tone.Transport.stop()
      Tone.Transport.position = 0
      Tone.Transport.bpm.value = bpmRef.current
      console.log('设置 Transport BPM:', bpmRef.current)

      // 为每个音符组创建事件
      for (let i = 0; i < allNotes.length; i++) {
        const noteGroup = allNotes[i]
        const time = noteGroup.time

        Tone.Transport.schedule((time) => {
          if (!isPlayingRef.current) return

          console.log(`播放时间点 ${time}，音符组 ${i}:`, noteGroup.notes)

          // 播放所有同时的音符
          for (const note of noteGroup.notes) {
            try {
              console.log(`播放音符: ${note.pitch}, 持续时间: ${note.duration}`)
              synth.triggerAttackRelease(note.pitch, note.duration, time)
            } catch (err) {
              console.error('播放音符失败:', err, note)
            }
          }

          // 更新光标位置
          if (osmdInstanceRef.current?.cursor) {
            // 确保光标移动到正确位置
            if (i === 0) {
              // 第一个音符，确保光标在开始位置
              osmdInstanceRef.current.cursor.reset()
            } else {
              // 移动到下一个位置
              osmdInstanceRef.current.cursor.next()
            }
            osmdInstanceRef.current.cursor.update()
          }

          // 更新进度
          setPlaybackProgress(((i + 1) / allNotes.length) * 100)
        }, time)
      }

      // 播放结束时停止
      const lastNoteGroup = allNotes[allNotes.length - 1]
      const totalDuration = lastNoteGroup.time + (lastNoteGroup.notes[0]?.duration || 1)
      console.log('预计总时长:', totalDuration)
      
      Tone.Transport.schedule(() => {
        console.log('播放结束')
        handleStop()
      }, totalDuration)

      // 开始播放
      console.log('启动 Transport')
      Tone.Transport.start()
    } catch (err) {
      console.error('播放失败:', err)
      setError(`播放失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }

  // 停止播放
  const handleStop = async () => {
    try {
      const Tone = await import('tone')
      Tone.Transport.stop()
      Tone.Transport.cancel()
      Tone.Transport.position = 0
    } catch (err) {
      console.error('停止 Transport 失败:', err)
    }

    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current)
      playbackTimeoutRef.current = null
    }

    if (synthRef.current) {
      synthRef.current.releaseAll()
    }

    if (osmdInstanceRef.current?.cursor) {
      osmdInstanceRef.current.cursor.hide()
      osmdInstanceRef.current.cursor.reset()
    }

    setIsPlaying(false)
    isPlayingRef.current = false
    setPlaybackProgress(0)
  }

  // 清理函数
  useEffect(() => {
    return () => {
      handleStop()
      // OSMD 会在容器移除时自动清理
      osmdInstanceRef.current = null
      if (synthRef.current) {
        synthRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        使用 OpenSheetMusicDisplay 渲染 MusicXML 乐谱，支持缩放、页面导航、示例切换和音频播放。
      </p>

      {/* 播放进度 */}
      {isPlaying && (
        <div className="w-full rounded-lg bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-lg bg-primary-500 transition-all duration-100"
            style={{ width: `${playbackProgress}%` }}
          />
        </div>
      )}

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

        {/* 播放控制 */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? 'destructive' : 'default'}
            size="sm"
            onClick={handlePlay}
            disabled={isLoading || !osmdInstanceRef.current}
            className="h-8 px-3 text-xs"
          >
            {isPlaying ? '暂停' : '播放'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!isPlaying || isLoading}
            className="h-8 px-3 text-xs"
          >
            停止
          </Button>
        </div>

        {/* 页面导航 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePagePrevious}
            disabled={isLoading || isPlaying}
            className="h-8 px-3 text-xs"
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePageNext}
            disabled={isLoading || isPlaying}
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

