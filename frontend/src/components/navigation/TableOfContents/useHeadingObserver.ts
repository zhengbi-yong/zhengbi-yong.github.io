import { useEffect, useRef } from 'react'
import type { TOC } from '@/lib/types/toc'

interface UseHeadingObserverOptions {
  toc?: TOC
  activeHeadingId: string | null
  isMobileRef: React.MutableRefObject<boolean>
  isMobileExpanded: boolean
  setActiveHeadingId: (id: string | null) => void
  tocMobileContentRef: React.RefObject<HTMLElement>
  _tocContentRef: React.RefObject<HTMLDivElement | null>
  /** 桌面端 TOC 容器 ref — 用于自动滚动使活动条目可见 */
  tocContainerRef?: React.RefObject<HTMLDivElement | null>
  /** 阅读进度回调 (0-100) */
  onProgressChange?: (progress: number) => void
}

/**
 * 标题滚动监听 Hook
 *
 * 高亮策略（始终保证有且只有一个条目高亮）：
 *  1. 有交集标题时，优先选深度最大（同层选视口最靠上）
 *  2. 无交集标题时（长章节中间），选滚动位置下方最近的标题
 *  3. 滚动位置超出所有标题时，回退到最后一个标题
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

      // ── 统一高亮选择逻辑 ──────────────────────────────────────────────────
      // 优先级：
      //  A. 有交集标题 → 选 DOM 顺序最后（即嵌套最深）的小标题
      //  B. 无交集标题（长章节中间）→ 选滚动位置下方最近的标题
      //  C. 已滚过所有标题 → 回退到最后一个
      const updateActiveHeading = () => {
        const scrollTop = window.scrollY
        const viewportHeight = window.innerHeight
        const bottomThreshold = scrollTop + viewportHeight * 0.3

        // 收集所有可见标题
        // h.bottom > 0         — 标题底部未完全滚出视口顶部
        // h.offsetTop <= ...    — 标题顶部在视口底部上方
        // 当页面顶部时所有标题都在下方视口外，候选集为空，
        // 此时用全部 headingElements（取第一个）作为 fallback。
        let candidateHeadings = headingElements
          .map((h) => {
            const rect = h.getBoundingClientRect()
            return {
              id: h.id,
              top: rect.top,
              bottom: rect.bottom,
              offsetTop: scrollTop + rect.top,
              domIndex: headingElements.indexOf(h),
            }
          })
          .filter((h) => h.bottom > 0 && h.offsetTop <= scrollTop + viewportHeight)

        // 候选集为空（页面顶部时）→ 取文档第一个标题作为初始高亮
        if (candidateHeadings.length === 0 && headingElements.length > 0) {
          const firstHeading = headingElements[0]
          const rect = firstHeading.getBoundingClientRect()
          candidateHeadings = [{
            id: firstHeading.id,
            top: rect.top,
            bottom: rect.bottom,
            offsetTop: scrollTop + rect.top,
            domIndex: 0,
          }]
        }

        if (candidateHeadings.length === 0) return

        // 触发区内的交集标题
        const intersecting = candidateHeadings.filter(
          (h) => h.top <= bottomThreshold && h.top > -viewportHeight
        )

        let nextActive: string

        if (intersecting.length > 0) {
          // 情况 A：取 DOM 顺序最后（即嵌套最深）的小标题
          intersecting.sort((a, b) => a.domIndex - b.domIndex)
          nextActive = intersecting[intersecting.length - 1].id
        } else {
          // 情况 B：没有交集标题，选滚动位置下方最近的
          const belowScroll = candidateHeadings
            .filter((h) => h.offsetTop > scrollTop)
            .sort((a, b) => a.offsetTop - b.offsetTop)

          if (belowScroll.length > 0) {
            nextActive = belowScroll[0].id
          } else {
            // 已在文档底部
            nextActive = headingElements[headingElements.length - 1].id
          }
        }

        if (nextActive && nextActive !== activeHeadingIdRef.current) {
          setActiveHeadingId(nextActive)
        }
      }

      // IntersectionObserver：标题进出视口边缘时触发
      // rootMargin: 触发区从视口顶部延伸（-top 到 -bottom 的范围）
      // '-120px 0px -80% 0px' 时首个标题 rect.top=976（远在视口下方），
      // 不会触发 IntersectionObserver，导致页面顶部完全没有高亮。
      // 改为 '0px 0px -80% 0px'：只要有标题在视口顶部至上 20% 的带状区域
      // 就能触发，确保页面顶部有初始高亮。
      let debounceTimer: NodeJS.Timeout | null = null
      const headingObserver = new IntersectionObserver(
        () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            updateActiveHeading()
            updateProgress()
          }, 80)
        },
        { rootMargin: '0px 0px -80% 0px', threshold: 0 }
      )
      headingElements.forEach((heading) => headingObserver.observe(heading))

      // scroll 监听：作为辅助刷新，确保长章节中间始终有高亮 + 进度更新
      let lastScrollFire = 0
      const handleScroll = () => {
        const now = Date.now()
        if (now - lastScrollFire < 80) return
        lastScrollFire = now
        updateActiveHeading()
        updateProgress()
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      // 初始激活 + 进度：在 observer 初始化后执行
      // 确保 headingElements 已找到（initObserver 同步执行），
      // 延迟 50ms 让 DOM 完全稳定
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
