import { useEffect, useRef } from 'react'
import type { TOC } from '@/lib/types/toc'

interface UseHeadingObserverOptions {
  toc?: TOC
  activeHeadingId: string | null
  isMobileRef: React.MutableRefObject<boolean>
  isMobileExpanded: boolean
  setActiveHeadingId: (id: string | null) => void
  tocMobileContentRef: React.RefObject<HTMLElement>
  /** @deprecated 已废弃，使用 tocContainerRef 代替 */
  _tocContentRef?: React.RefObject<HTMLDivElement | null>
  /** 桌面端 TOC 容器 ref — 用于自动滚动使活动条目可见 */
  tocContainerRef?: React.RefObject<HTMLDivElement | null>
  /** 阅读进度回调 (0-100) */
  onProgressChange?: (progress: number) => void
}

/**
 * 标题滚动监听 Hook
 *
 * 高亮策略（始终保证有且只有一个条目高亮）：
 *  遍历所有标题 DOM，找到"最后出现在视口上方"的标题作为 active。
 *  使用 scrollY + rect.top 计算绝对 Y 坐标，避免依赖 IntersectionObserver 触发时机。
 *
 * 副作用：
 *  - 当 activeHeadingId 变化时，自动滚动 TOC 使对应条目可见
 *  - 实时计算阅读进度并通过 onProgressChange 回调推送
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
  // 防抖计时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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

    const STICKY_HEADER = 72 // sticky header 高度
    const DEBOUNCE_MS = 80

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
      // 从 TOC 数据反向查找
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
     * 遍历所有标题，找到"在视口中最后出现"的那个标题。
     * 使用 scrollY + rect.top 计算绝对 Y 坐标，避开 IntersectionObserver 触发时机问题。
     *
     * 逻辑：
     * - 如果一个标题的"绝对顶部"（scrollY + rect.top）<= scrollY + STICKY_HEADER，
     *   说明这个标题的顶部已经"越过"了 sticky header 线（进入可视区或以上）。
     * - 我们要找的是这些"已进入"的标题中最下面的一个（即 DOM 顺序最后的一个）。
     */
    const updateActiveHeading = () => {
      const scrollY = window.scrollY
      const headings = getHeadingElements()
      if (headings.length === 0) return

      // 遍历 DOM 顺序，找到"最后出现在视口内或以上"的标题
      let activeId: string | null = null

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const rect = heading.getBoundingClientRect()
        // 标题顶部的绝对 Y 坐标
        const absoluteTop = scrollY + rect.top

        // 如果标题顶部已经"触及"或越过 sticky header 线
        if (absoluteTop <= scrollY + STICKY_HEADER) {
          activeId = heading.id
          // 继续遍历，找到更下面的
        } else {
          // 遇到第一个"尚未触及 sticky header 线"的标题，停止
          // 此时 activeId 是上一个（已触及的）
          break
        }
      }

      // 如果所有标题都触及了（快速滚动到底部），activeId = 最后一个
      if (!activeId) {
        activeId = headings[headings.length - 1]?.id ?? null
      }

      if (activeId && activeId !== activeHeadingIdRef.current) {
        activeHeadingIdRef.current = activeId
        setActiveHeadingId(activeId)
      }
    }

    // IntersectionObserver：标题进入/离开视口时触发（防抖）
    const headingObserver = new IntersectionObserver(
      () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
          updateActiveHeading()
          updateProgress()
        }, DEBOUNCE_MS)
      },
      // rootMargin: 0 表示触发区是整个视口
      { rootMargin: '0px', threshold: 0 }
    )

    const headings = getHeadingElements()
    headings.forEach((heading) => headingObserver.observe(heading))

    // scroll 监听：主要驱动源，每次滚动都重新计算
    let lastScrollFire = 0
    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollFire < DEBOUNCE_MS) return
      lastScrollFire = now
      updateActiveHeading()
      updateProgress()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 初始化：设置初始高亮（延迟确保 DOM 已渲染完成）
    setTimeout(() => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setActiveHeadingId(hash)
      } else {
        updateActiveHeading()
      }
      updateProgress()
    }, 50)

    // hash 变化监听
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) setActiveHeadingId(hash)
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      headingObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHashChange)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [toc, setActiveHeadingId])
}
