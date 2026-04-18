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
 * 算法（Docusaurus 风格）：
 * - 找到第一个"其顶部已进入视口"的标题 H（rect.top >= 0）
 * - 如果 H 的顶部在视口上半部分（< viewportHeight/2），说明正在读 H 的上一章
 * - 否则（H 已到视口下半部分），当前章节就是 H 本身
 *
 * 特点：
 * - scroll 事件驱动，无 IntersectionObserver
 * - 无防抖，滚动即时响应
 * - 永远有且只有一个条目高亮
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

    const getHeadingElements = (): HTMLElement[] => {
      const tocIds = toc.map((item) => item.url.replace('#', ''))

      const selectors = [
        'article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]',
        'main h1[id], main h2[id], main h3[id], main h4[id], main h5[id], main h6[id]',
        '.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id], .prose h5[id], .prose h6[id]',
        'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
      ]
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
          .filter((heading) => {
            const id = heading.id || heading.getAttribute('id')
            return id && tocIds.includes(id)
          })
        if (elements.length > 0) return elements
      }
      return []
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
     * 核心算法（"正在读哪一章"）：
     *
     * 找到第一个"其底部已完全滚出视口上方"的标题 H（rect.bottom < 0）。
     * H 的下一个就是当前正在阅读的章节（因为 H 的内容已全部读完）。
     *
     * 例：视口高度 720px。
     * 标题 2.4: rect.top=80, rect.bottom=200  → rect.bottom > 0 → 未读完
     * 标题 2.5: rect.top=-100, rect.bottom=20  → rect.bottom > 0 → 未读完
     * 标题 2.6: rect.top=-500, rect.bottom=-200 → rect.bottom < 0 → 已读完
     * → 2.5 是当前章节（2.6 的前一个）
     *
     * fallback：第一个标题（当所有标题都还在视口内时）
     *
     * 为什么不用 Docusaurus 的方法（rect.top >= 0）？
     * 因为进入新章节时，顶部刚进入视口会在"上半部分"触发高亮上一个章节，
     * 造成向下滚动时 TOC 高亮先跳到上一章再跳回来的"反向"体验。
     * 用 rect.bottom < 0 只有在读完上一章后才切换，高亮永远是当前章节。
     */
    const updateActiveHeading = () => {
      const headings = getHeadingElements()
      if (headings.length === 0) return

      // 找到第一个"底部已滚出视口上方"的标题（即已读完）
      let firstScrolledPast: HTMLElement | null = null
      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect()
        if (rect.bottom < 0) {
          firstScrolledPast = headings[i]
          break
        }
      }

      let activeId: string | null = null

      if (!firstScrolledPast) {
        // 所有标题都还在视口内（或部分在视口下方）→ 高亮第一个
        activeId = headings[0]?.id ?? null
      } else {
        const idx = headings.indexOf(firstScrolledPast)
        // firstScrolledPast 是已读完的章节，它的下一个是当前正在阅读的
        const nextHeading = headings[idx + 1]
        if (nextHeading) {
          activeId = nextHeading.id
        } else {
          // 没有下一个了（已到最后章节），高亮已读完章节本身
          activeId = firstScrolledPast.id
        }
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
