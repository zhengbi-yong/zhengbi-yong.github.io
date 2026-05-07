'use client'

import React, { useState } from 'react'

interface BilibiliVideoProps {
  bvid: string
  poster?: string
  className?: string
}

export default function BilibiliVideo({
  bvid,
  poster,
  className = '',
}: BilibiliVideoProps) {
  const [playing, setPlaying] = useState(false)

  // 封面容器（16:9 等比例）
  const containerClass = `relative w-full ${className}`

  if (playing) {
    return (
      <div className={containerClass} style={{ aspectRatio: '16 / 9' }}>
        <iframe
          src={`https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1&high_quality=1`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>
    )
  }

  return (
    <div
      className={`${containerClass} cursor-pointer group`}
      style={{ aspectRatio: '16 / 9' }}
      onClick={() => setPlaying(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlaying(true) }}
      aria-label="点击播放视频"
    >
      {/* 封面 */}
      <div
        className="w-full h-full bg-cover bg-center bg-no-repeat bg-neutral-200 dark:bg-neutral-800 rounded-lg"
        style={poster ? { backgroundImage: `url(${poster})` } : undefined}
      />
      {/* 遮罩 + 播放按钮 */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-lg">
          <svg className="w-7 h-7 text-neutral-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
