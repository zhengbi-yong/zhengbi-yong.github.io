'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader } from './ui/Loader'

// 动态导入音乐播放器组件
const DynamicMusicPlayer = dynamic(
  () => import('./audio/MusicPlayer').then((mod) => ({ default: mod.MusicPlayer })),
  {
    loading: () => <Loader className="h-32" />,
    ssr: false, // Web Audio API 需要用户交互
  }
)

interface Track {
  id: string
  title: string
  artist: string
  url: string
  coverUrl?: string
}

interface MusicPlayerProps {
  src?: string
  tracks?: Track[]
  title?: string
  artist?: string
  autoPlay?: boolean
  className?: string
}

export function MusicPlayer({
  src,
  tracks,
  title,
  artist,
  autoPlay = false,
  className = '',
}: MusicPlayerProps) {
  // 如果提供了单个音频文件，转换为 tracks 格式
  const tracksList =
    tracks ||
    (src
      ? [
          {
            id: 'single',
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist',
            url: src,
          },
        ]
      : [])

  return (
    <Suspense fallback={<Loader className="h-32" />}>
      <DynamicMusicPlayer tracks={tracksList} autoPlay={autoPlay} className={className} />
    </Suspense>
  )
}

// 导出类型以供其他组件使用
export type { MusicPlayerProps, Track }
