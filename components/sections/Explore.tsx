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
      if (isPlaying || playAttempts >= MAX_PLAY_ATTEMPTS) return
      playAttempts++

      const playPromise = video.play()
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
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (video.paused) {
                playAttempts = 0
                tryPlay()
              }
            } else {
              if (!video.paused) {
                video.pause()
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
      observer.observe(video)
    }

    function handleVisibilityChange() {
      if (!document.hidden && !video.paused) {
        const rect = video.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (isInViewport) {
          playAttempts = 0
          tryPlay()
        }
      }
    }

    // 初始化
    function init() {
      if (video.readyState >= 2) {
        tryPlay()
      } else {
        video.addEventListener('loadeddata', tryPlay, { once: true })
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
    }
  }, [])

  return (
    <section className="py-8 sm:py-12 md:py-16 md:pb-12 container mx-auto px-4 sm:px-6 xl:px-8">
      <div className="space-y-6 sm:space-y-8 md:space-y-8">
        {title && <SectionHeader title={title} description={description} />}
      </div>

      <div className={cn(styles.exploreContent, 'w-full relative mt-6 sm:mt-8')}>
        <div
          className={cn(
            styles.exploreList,
            'w-full relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
          )}
        >
          {/* 第一列 */}
          <div className={cn(styles.exploreColumn1, 'w-full flex gap-3 sm:gap-4 flex-col')}>
            {/* Design & Code */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem1,
                'bg-gray-50/75 dark:bg-gray-900/75 relative overflow-hidden rounded-xl border border-primary/15 dark:border-neutral-700/50 h-[200px] sm:h-[220px] md:h-[264px]'
              )}
            >
              <div className={styles.content}>
                <h3>Design & Code</h3>
                <p>Turning ideas into beautiful, functional experiences.</p>
              </div>
              <div
                className={cn(
                  styles.keyboard,
                  'absolute right-[-35%] sm:right-[-50%] md:right-[-58%] bottom-0 top-0 flex items-center self-center w-[300px] sm:w-[320px] md:w-[390px] h-auto'
                )}
              >
                <Image
                  src="/assets/tools/keyboard.png"
                  alt="Keyboard"
                  width={390}
                  height={264}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Faves */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem2,
                'bg-gray-50/75 dark:bg-gray-900/75 relative overflow-hidden rounded-xl border border-primary/15 dark:border-neutral-700/50 h-[180px] sm:h-[200px]'
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
                  'absolute right-0 bottom-0 top-0 w-full h-full'
                )}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={cn(
                      styles.game,
                      'absolute right-[-21%] bottom-0 top-0 mt-[-10%] flex items-center self-center w-auto h-[100px] sm:h-[120px] md:h-[130px] z-10'
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
                      className="w-full h-full object-cover self-center flex"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 第二列 */}
          <div className="w-full flex gap-3 sm:gap-4 flex-col">
            {/* Writing */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem3,
                'bg-gray-50/75 dark:bg-gray-900/75 relative overflow-hidden rounded-xl border border-primary/15 dark:border-neutral-700/50 h-[180px] sm:h-[200px]'
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
                  'absolute right-[5%] sm:right-[-10%] md:right-[-7%] bottom-[14%] w-[120px] sm:w-[130px] md:w-[148px] h-auto'
                )}
              >
                <Image
                  src="/assets/tools/retro-computer.png"
                  alt="Retro Computer"
                  width={148}
                  height={148}
                  className="w-full h-full object-cover z-10 relative"
                />
                <div className="absolute inset-0 w-[92px] sm:w-[100px] md:w-[116px] h-[76px] sm:h-[86px] md:h-[96px] top-[10.5%] left-[10%] rounded-[8px] rounded-b-[3px] overflow-hidden z-20">
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
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* My Tools */}
            <div
              className={cn(
                styles.exploreItem,
                styles.exploreItem4,
                'bg-gray-50/75 dark:bg-gray-900/75 relative overflow-hidden rounded-xl border border-primary/15 dark:border-neutral-700/50 h-[200px] sm:h-[220px] md:h-[264px]'
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
                  'absolute right-[5%] sm:right-[-10%] md:right-[-7%] bottom-0 top-0 flex items-center'
                )}
              >
                <ToolsCard />
              </div>
            </div>
          </div>

          {/* 第三列 */}
          <div className="w-full col-span-1 sm:col-span-2 lg:col-span-1">
            <div
              className={cn(
                styles.exploreItem,
                'bg-gray-50/75 dark:bg-gray-900/75 relative overflow-hidden rounded-xl border border-primary/15 dark:border-neutral-700/50'
              )}
            >
              <div
                className={cn(
                  styles.exploreFigure,
                  'relative rounded-xl overflow-hidden w-full h-[480px] sm:h-[400px] md:h-[480px]'
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
