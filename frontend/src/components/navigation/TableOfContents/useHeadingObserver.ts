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
 *  基于 Docusaurus TOC 算法 — 找到第一个顶部"触及"视口顶部的标题。
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
  void _tocContentRef // 参数保留但不使用（由 tocContainerRef 替代）
  const activeHeadingIdRef = useRef<string | null>(null)
  const onProgressChangeRef = useRef(onProgressChange)
  // 追踪上一次的 progress，避免频繁回调
  const lastProgressRef = useRef<number>(-1)

  // 同步 ref，保证 handler 内能读到最新值
  useEffect(() => {
    activeHeadingIdRef.current = activeHeadingId
  }, [activeHeadingId])

  // 同步 onProgressChange ref
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

  // ── 自动滚动 TOC 使活动条目可见 ──────────────────────────────────────────
  // 当 activeHeadingId 变化（非初次挂载），将对应条目滚动到 TOC 可视范围内
  const prevActiveHeadingIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      activeHeadingId &&
      activeHeadingId !== prevActiveHeadingIdRef.current &&
      tocContainerRef?.current
    ) {
      // 延迟执行，确保 DOM 已更新（active class 已在 DOM 中）
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

    const initObserver = () => {
      // 尝试多种选择器找到文章标题
      const selectors = [
        'article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]',
        'main h1[id], main h2[id], main h3[id], main h4[id], main h5[id], main h6[id]',
        '.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id], .prose h5[id], .prose h6[id]',
        'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
      ]

      let headingElements: HTMLElement[] = []
      for (const selector of selectors) {
        headingElements = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (headingElements.length > 0) break
      }

      // 如果选择器都找不到，从 TOC 数据反向查找
      if (headingElements.length === 0) {
        const allHeadings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
        const tocIds = toc.map((item) => item.url.replace('#', ''))
        headingElements = allHeadings.filter((heading) => {
          const id = heading.id || heading.getAttribute('id')
          return id && tocIds.includes(id)
        })
      }

      if (headingElements.length === 0) return undefined

      // 获取 sticky header 高度，用于判断第一个标题是否被遮挡
      const STICKY_HEADER_HEIGHT = 72

      // ── 计算阅读进度 ────────────────────────────────────────────────────────
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

      // ── Docusaurus 算法：获取活动锚点 ─────────────────────────────────────
      /**
       * 获取元素的可视边界（处理 anchor 元素高度为 0 的情况）
       */
      const getVisibleRect = (el: HTMLElement): DOMRect => {
        const rect = el.getBoundingClientRect()
        // 如果 rect.top === rect.bottom，说明是个 height=0 的 anchor，用父元素
        if (rect.top === rect.bottom) {
          const parent = el.parentElement as HTMLElement
          if (parent) return parent.getBoundingClientRect()
        }
        return rect
      }

      /**
       * 判断 heading 是否在视口上半部分
       * 用于决定"下一个将出现的标题"是否应该高亮
       */
      const isInTopHalf = (rect: DOMRect): boolean => {
        return rect.top > 0 && rect.bottom < window.innerHeight / 2
      }

      /**
       * 核心高亮算法 — Docusaurus 方案
       *
       * 核心思想：找到文档顺序中第一个"顶部触及视口顶部"的标题。
       * "触及"的意思是 heading.top >= anchorTopOffset。
       * 这个标题就是"下一个将出现在视口顶部"的标题。
       *
       * 如果这个标题在视口上半部分 → 它就是当前高亮。
       * 如果这个标题在视口下半部分（或下方）→ 前一个标题是高亮（当前阅读内容属于前一个）。
       *
       * 这样保证了：
       * 1. 滚动时永远有且只有一个高亮
       * 2. 长章节中间（无交集标题）也有正确的高亮
       * 3. 算法简洁，不依赖复杂的交集计算
       */
      const getActiveAnchor = (): string | null => {
        // 找到第一个顶部在视口顶部（或以下）的标题
        // heading.top >= STICKY_HEADER_HEIGHT 意味着标题已"触及"视口顶部（考虑了 sticky header）
        const nextVisible = headingElements.find((h) => {
          const rect = getVisibleRect(h)
          // 标题的顶部已越过 sticky header（进入可视区）
          return rect.top >= STICKY_HEADER_HEIGHT
        })

        if (nextVisible) {
          const rect = getVisibleRect(nextVisible)
          // 如果标题在视口上半部分 → 高亮这个
          if (isInTopHalf(rect)) {
            return nextVisible.id
          }
          // 如果在视口下半部分（或超出视口）→ 高亮前一个（当前阅读内容属于前一个）
          const idx = headingElements.indexOf(nextVisible)
          if (idx > 0) {
            return headingElements[idx - 1].id
          }
          // idx === 0 → 第一个标题就在下半部分 → 高亮第一个
          return nextVisible.id
        }

        // 没有找到"在视口顶部"的标题 → 已在文档底部 → 高亮最后一个
        return headingElements[headingElements.length - 1]?.id ?? null
      }

      // ── 更新 TOC 高亮 ──────────────────────────────────────────────────────
      const updateActiveHeading = () => {
        const nextActive = getActiveAnchor()
        if (nextActive && nextActive !== activeHeadingIdRef.current) {
          setActiveHeadingId(nextActive)
        }
      }

      // IntersectionObserver：仅用于通知 scroll handler 重新检查
      // 不依赖它来确定高亮（scroll handler 的 getActiveAnchor 才是准确算法）
      let debounceTimer: NodeJS.Timeout | null = null
      const headingObserver = new IntersectionObserver(
        () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            updateActiveHeading()
            updateProgress()
          }, 80)
        },
        // rootMargin: 0 表示触发区是整个视口
        // threshold: 0 只要有像素进入/离开就触发
        { rootMargin: '0px', threshold: 0 }
      )
      headingElements.forEach((heading) => headingObserver.observe(heading))

      // scroll 监听：主要驱动源，每次滚动都重新计算
      let lastScrollFire = 0
      const handleScroll = () => {
        const now = Date.now()
        if (now - lastScrollFire < 80) return
        lastScrollFire = now
        updateActiveHeading()
        updateProgress()
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      // 初始化：在 observer 初始化后执行，设置初始高亮
      setTimeout(() => {
        const hash = window.location.hash.substring(1)
        if (hash) {
          setActiveHeadingId(hash)
        } else {
          updateActiveHeading()
        }
        updateProgress()
      }, 50)

      // hash 变化
      const handleHashChange = () => {
        const hash = window.location.hash.substring(1)
        if (hash) setActiveHeadingId(hash)
      }
      window.addEventListener('hashchange', handleHashChange)

      return () => {
        headingObserver.disconnect()
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('hashchange', handleHashChange)
        if (debounceTimer) clearTimeout(debounceTimer)
      }
    }

    const timeoutId = setTimeout(initObserver, 300)
    return () => clearTimeout(timeoutId)
  }, [toc, setActiveHeadingId])
}
