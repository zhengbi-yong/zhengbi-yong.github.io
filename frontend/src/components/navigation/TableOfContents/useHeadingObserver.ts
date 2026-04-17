import { useEffect, useRef } from 'react'
import type { TOC } from '@/lib/types/toc'

interface UseHeadingObserverOptions {
  toc?: TOC
  activeHeadingId: string | null
  isMobileRef: React.MutableRefObject<boolean>
  isMobileExpanded: boolean
  setActiveHeadingId: (id: string | null) => void
  tocMobileContentRef: React.RefObject<HTMLElement>
  /** @deprecated */
  _tocContentRef?: React.RefObject<HTMLDivElement | null>
  /** 桌面端 TOC 容器 ref — 用于自动滚动 */
  tocContainerRef?: React.RefObject<HTMLDivElement | null>
  /** 阅读进度回调 (0-100) */
  onProgressChange?: (progress: number) => void
}

/**
 * 标题滚动监听 Hook
 *
 * 算法：遍历所有标题 DOM，找到"最后出现在视口上方"的标题作为 active。
 * 使用 scrollY + rect.top 计算绝对 Y 坐标，每次 scroll 事件重新计算。
 *
 * 特点：
 *  - scroll 驱动（不需要 IntersectionObserver）
 *  - 防抖 100ms，避免高频滚动时性能问题
 *  - 保证永远有且只有一个条目高亮
 */
export function useHeadingObserver({
  toc,
  activeHeadingId,
  isMobileRef,
  isMobileExpanded,
  setActiveHeadingId,
  tocMobileContentRef,
  _tocContentRef,
  tocContainerRef,
  onProgressChange,
}: UseHeadingObserverOptions) {
  void _tocContentRef
  const activeHeadingIdRef = useRef<string | null>(null)
  const onProgressChangeRef = useRef(onProgressChange)
  const lastProgressRef = useRef<number>(-1)

  // 同步 ref
  useEffect(() => {
    activeHeadingIdRef.current = activeHeadingId
  }, [activeHeadingId])

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange
  }, [onProgressChange])

  // 移动端面板打开时，滚动到活动链接
  useEffect(() => {
    if (isMobileRef.current && isMobileExpanded && activeHeadingId && tocMobileContentRef.current) {
      setTimeout(() => {
        const activeLink = tocMobileContentRef.current?.querySelector<HTMLAnchorElement>(
          `.toc-link[data-id="${activeHeadingId}"]`
        )
        if (activeLink) {
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }, 100)
    }
  }, [isMobileRef, isMobileExpanded, activeHeadingId, tocMobileContentRef])

  // 自动滚动 TOC 使活动条目可见
  const prevActiveHeadingIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      activeHeadingId &&
      activeHeadingId !== prevActiveHeadingIdRef.current &&
      tocContainerRef?.current
    ) {
      const timer = setTimeout(() => {
        const link = tocContainerRef.current?.querySelector<HTMLAnchorElement>(
          `.toc-link[data-id="${activeHeadingId}"]`
        )
        if (link) {
          link.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }, 60)
      prevActiveHeadingIdRef.current = activeHeadingId
      return () => clearTimeout(timer)
    }
    prevActiveHeadingIdRef.current = activeHeadingId ?? null
    return undefined
  }, [activeHeadingId, tocContainerRef])

  useEffect(() => {
    if (!toc || toc.length === 0) return undefined

    const STICKY_HEADER = 72

    const getHeadingElements = (): HTMLElement[] => {
      const selectors = [
        'article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]',
        'main h1[id], main h2[id], main h3[id], main h4[id], main h5[id], main h6[id]',
        '.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id], .prose h5[id], .prose h6[id]',
        'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
      ]
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (elements.length > 0) return elements
      }
      const allHeadings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
      const tocIds = toc.map((item) => item.url.replace('#', ''))
      return allHeadings.filter((heading) => {
        const id = heading.id || heading.getAttribute('id')
        return id && tocIds.includes(id)
      })
    }

    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
      if (Math.abs(progress - lastProgressRef.current) >= 1) {
        lastProgressRef.current = progress
        onProgressChangeRef.current?.(progress)
      }
    }

    /**
     * 核心算法：
     * 遍历 DOM 顺序的所有标题，找到"最后出现在视口上方"的标题。
     * "视口上方" = 标题的 absoluteTop（scrollY + rect.top）<= scrollY + STICKY_HEADER
     *
     * 遇到第一个尚未进入的标题就停止，保证永远有且只有一个 active。
     */
    const updateActiveHeading = () => {
      const scrollY = window.scrollY
      const headings = getHeadingElements()
      if (headings.length === 0) return

      let activeId: string | null = null

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const rect = heading.getBoundingClientRect()
        // absoluteTop = 标题顶部在文档中的绝对 Y 坐标
        const absoluteTop = scrollY + rect.top

        if (absoluteTop <= scrollY + STICKY_HEADER) {
          // 标题已进入视口（顶部在 sticky header 线或以下）
          activeId = heading.id
        } else {
          // 第一个尚未进入的标题 — 停止，使用上一个（已进入的）
          break
        }
      }

      // 快速滚动到底部（所有标题都已进入）
      if (!activeId) {
        activeId = headings[headings.length - 1]?.id ?? null
      }

      if (activeId !== activeHeadingIdRef.current) {
        activeHeadingIdRef.current = activeId
        setActiveHeadingId(activeId)
      }

      updateProgress()
    }

    const handleScroll = () => {
      updateActiveHeading()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 初始化
    setTimeout(() => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setActiveHeadingId(hash)
      } else {
        updateActiveHeading()
      }
    }, 50)

    // hash 变化监听
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) setActiveHeadingId(hash)
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [toc, setActiveHeadingId])
}
