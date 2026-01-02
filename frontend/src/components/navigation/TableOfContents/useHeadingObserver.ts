import { useEffect, useRef, useCallback } from 'react'
import type { TOC } from '@/lib/types/toc'
import type { LinkMap } from './types'

interface UseHeadingObserverOptions {
  toc?: TOC
  activeHeadingId: string | null
  isMobileRef: React.MutableRefObject<boolean>
  isMobileExpanded: boolean
  setActiveHeadingId: (id: string | null) => void
  tocMobileContentRef: React.RefObject<HTMLElement>
  tocContentRef: React.RefObject<HTMLElement>
}

/**
 * 标题滚动监听 Hook
 * 使用 IntersectionObserver 监听标题滚动，自动高亮当前章节
 */
export function useHeadingObserver({
  toc,
  activeHeadingId,
  isMobileRef,
  isMobileExpanded,
  setActiveHeadingId,
  tocMobileContentRef,
  tocContentRef,
}: UseHeadingObserverOptions) {
  const activeHeadingIdRef = useRef<string | null>(null)

  // 同步 ref
  useEffect(() => {
    activeHeadingIdRef.current = activeHeadingId
  }, [activeHeadingId])

  // 创建 ID 到链接的映射
  const buildIdToLinkMap = useCallback((): LinkMap => {
    const map = new Map<string, HTMLAnchorElement>()
    return map
  }, [])

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

  // IntersectionObserver 监听标题
  useEffect(() => {
    if (!toc || toc.length === 0) return

    const initObserver = () => {
      const idToLinkMap = buildIdToLinkMap()
      if (idToLinkMap.size === 0) return

      // 尝试多种选择器
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

      // 如果找不到，尝试从 TOC 数据中获取
      if (headingElements.length === 0) {
        const allHeadings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
        const tocIds = toc.map((item) => item.url.replace('#', ''))
        headingElements = allHeadings.filter((heading) => {
          const id = heading.id || heading.getAttribute('id')
          return id && tocIds.includes(id)
        })
      }

      if (headingElements.length === 0) return

      const observerOptions = {
        rootMargin: '-120px 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1] as number[],
      }

      let debounceTimer: NodeJS.Timeout | null = null

      const headingObserver = new IntersectionObserver((entries) => {
        if (debounceTimer) clearTimeout(debounceTimer)

        debounceTimer = setTimeout(() => {
          const intersectingHeadings = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => ({
              id: entry.target.id,
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
            }))

          if (intersectingHeadings.length > 0) {
            const topHeading = intersectingHeadings.reduce((prev, current) => {
              if (prev.top < 120 && current.top >= 120) return prev
              if (prev.top >= 120 && current.top < 120) return current
              if (prev.top < 120 && current.top < 120) return current.top > prev.top ? current : prev
              if (prev.top >= 120 && current.top >= 120) return current.top < prev.top ? current : prev
              return prev
            }, intersectingHeadings[0] as any)

            if (topHeading.id && topHeading.id !== activeHeadingIdRef.current) {
              setActiveHeadingId(topHeading.id)
            }
          }
        }, 150)
      }, observerOptions)

      headingElements.forEach((heading) => headingObserver.observe(heading))

      // 初始激活状态
      const initActiveState = () => {
        const hash = window.location.hash.substring(1)
        if (hash) {
          setActiveHeadingId(hash)
          return
        }

        const visibleHeadings = headingElements
          .map((heading) => ({
            top: heading.getBoundingClientRect().top,
            id: heading.id,
          }))
          .filter((h) => h.top >= 100 && h.top <= window.innerHeight / 2)
          .sort((a, b) => a.top - b.top)

        if (visibleHeadings.length > 0) {
          setActiveHeadingId(visibleHeadings[0].id)
        } else if (headingElements.length > 0) {
          setActiveHeadingId(headingElements[0].id)
        }
      }

      setTimeout(initActiveState, 200)

      const handleHashChange = () => {
        const hash = window.location.hash.substring(1)
        if (hash) setActiveHeadingId(hash)
      }

      window.addEventListener('hashchange', handleHashChange)

      // 滚动监听（后备方案）
      let scrollTimeout: NodeJS.Timeout | null = null
      const handleScroll = () => {
        if (scrollTimeout) return
        scrollTimeout = setTimeout(() => {
          const scrollPosition = window.scrollY + 120
          let currentActive: string | null = null

          for (let i = headingElements.length - 1; i >= 0; i--) {
            const heading = headingElements[i]
            const rect = heading.getBoundingClientRect()
            const elementTop = window.scrollY + rect.top

            if (elementTop <= scrollPosition) {
              currentActive = heading.id
              break
            }
          }

          if (currentActive && currentActive !== activeHeadingIdRef.current) {
            setActiveHeadingId(currentActive)
          }

          scrollTimeout = null
        }, 150)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        headingObserver.disconnect()
        window.removeEventListener('hashchange', handleHashChange)
        window.removeEventListener('scroll', handleScroll)
        if (scrollTimeout) clearTimeout(scrollTimeout)
        if (debounceTimer) clearTimeout(debounceTimer)
      }
    }

    const timeoutId = setTimeout(initObserver, 300)
    return () => clearTimeout(timeoutId)
  }, [toc, buildIdToLinkMap, setActiveHeadingId])
}
