'use client'

import { useRef, useEffect, useState } from 'react'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { cn } from '@/components/lib/utils'

interface WorkCardProps {
  name: string
  image: string
  url: string
  description?: string
  tags?: string[]
  video?: string
  isShow?: boolean
  layout?: 'featured' | 'grid'
  index?: number
  target?: string
  className?: string
}

/**
 * useVideoAutoplay - 视频自动播放 Hook
 * 使用 Intersection Observer 检测视口可见性，自动播放/暂停视频
 */
function useVideoAutoplay(
  videoRef: React.RefObject<HTMLVideoElement>,
  videoId: string
) {
  const [isPlaying, setIsPlaying] = useState(false)
  const playAttemptsRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const MAX_PLAY_ATTEMPTS = 3

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // 设置视频属性
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')

    /**
     * 尝试播放视频
     */
    const tryPlay = () => {
      if (isPlaying || playAttemptsRef.current >= MAX_PLAY_ATTEMPTS) return

      playAttemptsRef.current++

      const playPromise = video.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            playAttemptsRef.current = 0 // 成功时重置计数
          })
          .catch((error) => {
            setIsPlaying(false)
            console.debug(`Video autoplay attempt ${playAttemptsRef.current} failed:`, error.name)

            // 如果是用户交互问题，等待用户交互后重试
            if (error.name === 'NotAllowedError') {
              handleUserInteraction()
            }
          })
      }
    }

    /**
     * 处理用户交互以触发播放
     */
    const handleUserInteraction = () => {
      const interactionEvents = ['touchstart', 'click', 'scroll']

      const onInteraction = () => {
        tryPlay()
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, onInteraction)
        })
      }

      interactionEvents.forEach((event) => {
        document.addEventListener(event, onInteraction, { once: true, passive: true })
      })
    }

    /**
     * 设置 Intersection Observer
     */
    const setupIntersectionObserver = () => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 进入视口，尝试播放
              if (video.paused) {
                playAttemptsRef.current = 0 // 重置计数
                tryPlay()
              }
            } else {
              // 离开视口，暂停以节省资源
              if (!video.paused) {
                video.pause()
                setIsPlaying(false)
              }
            }
          })
        },
        {
          root: null,
          rootMargin: '50px', // 预加载
          threshold: 0.1,
        }
      )

      observerRef.current.observe(video)
    }

    /**
     * 处理页面可见性变化
     */
    const handleVisibilityChange = () => {
      if (!document.hidden && !video.paused) {
        // 页面可见且视频应该播放
        const rect = video.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

        if (isInViewport) {
          playAttemptsRef.current = 0
          tryPlay()
        }
      }
    }

    // 初始化
    if (video.readyState >= 2) {
      // HAVE_CURRENT_DATA
      tryPlay()
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true })
    }

    // 设置视口观察器
    setupIntersectionObserver()

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])
}

/**
 * WorkCard - 作品卡片组件
 * 参考 Astro 项目的 WorkCard 组件，适配项目现有风格
 * 支持图片和视频两种媒体类型，包含悬停效果和自动播放
 */
export default function WorkCard({
  name,
  description = '',
  url,
  image,
  tags = [],
  video,
  isShow = true,
  layout = 'grid',
  index = 0,
  target = '_blank',
  className = '',
}: WorkCardProps) {
  // 生成稳定的视频 ID
  const videoId = `workcard-video-${index}-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
  const videoRef = useRef<HTMLVideoElement>(null)

  // 使用自动播放 Hook（如果 video 不存在，Hook 内部会处理）
  useVideoAutoplay(videoRef, videoId)

  if (!isShow) return null

  return (
    <article
      className={cn(
        'group relative overflow-hidden transition-all duration-500 mb-8 bg-white/85 dark:bg-gray-900/85 p-5 border-[0.75px] border-solid border-primary-500/15 dark:border-primary-400/15 rounded-2xl backdrop-blur-sm',
        className
      )}
    >
      {/* Image/video container */}
      <div className="relative overflow-hidden aspect-video rounded-xl">
        {video ? (
          /* Video */
          <video
            ref={videoRef}
            id={videoId}
            src={video}
            poster={image}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
            <source src={video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          /* Image */
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-400/10"
            loading="lazy"
          />
        )}

        {/* Gradient overlay shown on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

        {/* Link button shown on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm shadow-lg transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 group-hover:scale-110">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-500 dark:text-primary-400"
            >
              <path d="M7 7h10v10"></path>
              <path d="M7 17 17 7"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div
        className={cn(
          'px-1 pt-6 pb-2',
          layout === 'featured' && 'md:px-1 md:pt-6 md:pb-2'
        )}
      >
        {/* Title and link icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className={cn(
              'text-neutral-900 dark:text-white leading-tight font-bold transition-colors duration-300 group-hover:text-primary-500 dark:group-hover:text-primary-400',
              layout === 'featured' ? 'text-2xl md:text-3xl' : 'text-2xl'
            )}
          >
            {name}
          </h3>

          {/* Link icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500/10 dark:bg-primary-400/20 text-primary-500 dark:text-primary-400 transition-all duration-300 group-hover:bg-primary-500 dark:group-hover:bg-primary-400 group-hover:text-white dark:group-hover:text-neutral-900 group-hover:rotate-45">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h10v10"></path>
                <path d="M7 17 17 7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="inline-flex items-center rounded-full bg-primary-500/8 dark:bg-primary-400/15 px-2.5 py-0.5 text-[10px] font-medium text-primary-500 dark:text-primary-400 border border-primary-500/10 dark:border-primary-400/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className={cn(
              'text-neutral-600 dark:text-neutral-400 leading-relaxed',
              layout === 'featured'
                ? 'text-base md:text-lg line-clamp-2'
                : 'text-sm line-clamp-2'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Link overlay for entire card */}
      <Link
        href={url}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">View {name}</span>
      </Link>
    </article>
  )
}

