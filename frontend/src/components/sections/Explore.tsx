'use client'

import { useEffect, useRef } from 'react'
import SectionHeader from './SectionHeader'
import MatterAnimation from '@/components/MatterAnimation'
import ToolsCard from '@/components/home/ToolsCard'
import Image from '@/components/Image'
import { cn } from '@/components/lib/utils'
import styles from './Explore.module.css'

interface ExploreProps {
  title?: string
  description?: string
}

/**
 * Explore - 探索部分组件
 * 基于提供的 Astro Explore 组件转换而来
 * 包含多个交互式卡片，展示不同的内容区域
 */
export default function Explore({ title, description }: ExploreProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // 视频自动播放逻辑
  useEffect(() => {
    const video = videoRef.current
    if (!video || !(video instanceof HTMLVideoElement)) return

    let isPlaying = false
    let observer: IntersectionObserver | null = null
    let playAttempts = 0
    const MAX_PLAY_ATTEMPTS = 3

    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.removeAttribute('controls')

    function tryPlay() {
      const currentVideo = videoRef.current
      if (!currentVideo || isPlaying || playAttempts >= MAX_PLAY_ATTEMPTS) return
      playAttempts++

      const playPromise = currentVideo.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true
            playAttempts = 0
          })
          .catch((error) => {
            isPlaying = false
            if (error.name === 'NotAllowedError') {
              handleUserInteraction()
            }
          })
      }
    }

    function handleUserInteraction() {
      const interactionEvents = ['touchstart', 'click', 'scroll']
      function onInteraction() {
        tryPlay()
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, onInteraction)
        })
      }
      interactionEvents.forEach((event) => {
        document.addEventListener(event, onInteraction, { once: true, passive: true })
      })
    }

    function setupIntersectionObserver() {
      const currentVideo = videoRef.current
      if (!currentVideo) return
      observer = new IntersectionObserver(
        (entries) => {
          const currentVideo = videoRef.current
          if (!currentVideo) return
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (currentVideo.paused) {
                playAttempts = 0
                tryPlay()
              }
            } else {
              if (!currentVideo.paused) {
                currentVideo.pause()
                isPlaying = false
              }
            }
          })
        },
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1,
        }
      )
      observer.observe(currentVideo)
    }

    function handleVisibilityChange() {
      const currentVideo = videoRef.current
      if (!currentVideo) return
      if (!document.hidden && !currentVideo.paused) {
        const rect = currentVideo.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (isInViewport) {
          playAttempts = 0
          tryPlay()
        }
      }
    }

    // 初始化
    function init() {
      const currentVideo = videoRef.current
      if (!currentVideo) return
      if (currentVideo.readyState >= 2) {
        tryPlay()
      } else {
        currentVideo.addEventListener('loadeddata', tryPlay, { once: true })
      }
      setupIntersectionObserver()
      document.addEventListener('visibilitychange', handleVisibilityChange)

      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        handleUserInteraction()
      }
    }

    init()

    return () => {
      if (observer) {
        observer.disconnect()
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 移除 loadeddata 事件监听器以防止内存泄漏
      const currentVideo = videoRef.current
      if (currentVideo) {
        currentVideo.removeEventListener('loadeddata', tryPlay)
      }
    }
  }, [])

  return (
    <section className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 md:py-16 md:pb-12 xl:px-8">
      <div className="space-y-6 sm:space-y-8 md:space-y-8">
        {title && <SectionHeader title={title} description={description} />}
      </div>

      <div className={cn(styles.exploreContent, 'relative mt-6 w-full sm:mt-8')}>
        <div
          className={cn(
            styles.exploreList,
            'relative grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'
          )}
        >
          {/* 第一列 */}
          <div className={cn(styles.exploreColumn1, 'flex w-full flex-col gap-3 sm:gap-4')}>
            {/* Design & Code */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem1,
                'border-primary/15 relative h-[200px] overflow-hidden rounded-xl border bg-gray-50/75 sm:h-[220px] md:h-[264px] dark:border-neutral-700/50 dark:bg-gray-900/75'
              )}
            >
              <div className={styles.content}>
                <h3>Design & Code</h3>
                <p>Turning ideas into beautiful, functional experiences.</p>
              </div>
              <div
                className={cn(
                  styles.keyboard,
                  'absolute top-0 right-[-35%] bottom-0 flex h-auto w-[300px] items-center self-center sm:right-[-50%] sm:w-[320px] md:right-[-58%] md:w-[390px]'
                )}
              >
                <Image
                  src="/assets/tools/keyboard.png"
                  alt="Keyboard"
                  width={390}
                  height={264}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Faves */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem2,
                'border-primary/15 relative h-[180px] overflow-hidden rounded-xl border bg-gray-50/75 sm:h-[200px] dark:border-neutral-700/50 dark:bg-gray-900/75'
              )}
            >
              <div className={styles.content}>
                <h3>Faves</h3>
                <p>Picked things I&apos;m genuinely into.</p>
              </div>
              <div
                className={cn(
                  styles.exploreFigure,
                  styles.gameContainer,
                  'absolute top-0 right-0 bottom-0 h-full w-full'
                )}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={cn(
                      styles.game,
                      'absolute top-0 right-[-21%] bottom-0 z-10 mt-[-10%] flex h-[100px] w-auto items-center self-center sm:h-[120px] md:h-[130px]'
                    )}
                    data-game={num}
                    style={{
                      right: `-${21 - (num - 1) * 2}%`,
                      marginTop: `${-10 + (num - 1) * 5}%`,
                      zIndex: num * 10,
                    }}
                  >
                    <Image
                      src={`/assets/tools/game/0${6 - num}-game-cassette.png`}
                      alt={`Game Cassette ${6 - num}`}
                      width={130}
                      height={130}
                      className="flex h-full w-full self-center object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 第二列 */}
          <div className="flex w-full flex-col gap-3 sm:gap-4">
            {/* Writing */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem3,
                'border-primary/15 relative h-[180px] overflow-hidden rounded-xl border bg-gray-50/75 sm:h-[200px] dark:border-neutral-700/50 dark:bg-gray-900/75'
              )}
            >
              <div className={styles.content}>
                <h3>Writing</h3>
                <p>Style guides, design notes, and quick reads.</p>
              </div>
              <div
                className={cn(
                  styles.exploreFigure,
                  styles.computer,
                  'absolute right-[5%] bottom-[14%] h-auto w-[120px] sm:right-[-10%] sm:w-[130px] md:right-[-7%] md:w-[148px]'
                )}
              >
                <Image
                  src="/assets/tools/retro-computer.png"
                  alt="Retro Computer"
                  width={148}
                  height={148}
                  className="relative z-10 h-full w-full object-cover"
                />
                <div className="absolute inset-0 top-[10.5%] left-[10%] z-20 h-[76px] w-[92px] overflow-hidden rounded-[8px] rounded-b-[3px] sm:h-[86px] sm:w-[100px] md:h-[96px] md:w-[116px]">
                  <video
                    ref={videoRef}
                    id="explore-computer-video"
                    src="/assets/tools/dreamcore.mp4"
                    poster="/assets/tools/dreamcore.jpg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                    disablePictureInPicture
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* My Tools */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem4,
                'border-primary/15 relative h-[200px] overflow-hidden rounded-xl border bg-gray-50/75 sm:h-[220px] md:h-[264px] dark:border-neutral-700/50 dark:bg-gray-900/75'
              )}
            >
              <div className={styles.content}>
                <h3>My Tools</h3>
                <p>Design tools I built to speed up my workflow!</p>
              </div>
              <div
                className={cn(
                  styles.exploreFigure,
                  styles.machine,
                  'absolute top-0 right-[5%] bottom-0 flex items-center sm:right-[-10%] md:right-[-7%]'
                )}
              >
                <ToolsCard />
              </div>
            </div>
          </div>

          {/* 第三列 */}
          <div className="col-span-1 w-full sm:col-span-2 lg:col-span-1">
            <div
              className={cn(
                styles.exploreItem,
                'border-primary/15 relative overflow-hidden rounded-xl border bg-gray-50/75 dark:border-neutral-700/50 dark:bg-gray-900/75'
              )}
            >
              <div
                className={cn(
                  styles.exploreFigure,
                  'relative h-[480px] w-full overflow-hidden rounded-xl sm:h-[400px] md:h-[480px]'
                )}
              >
                <MatterAnimation />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
