'use client'

import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import type { TOC, TOCItem } from '@/lib/types/toc'
import styles from './FloatingTOC.module.css'
import { cn } from './lib/utils'

interface FloatingTOCProps {
  toc?: TOC
  enabled?: boolean
}

interface HeadingNode extends TOCItem {
  children: HeadingNode[]
}

/**
 * FloatingTOC - 浮动目录组件
 * 基于提供的 Astro TOC 组件转换而来
 */
function FloatingTOC({ toc, enabled = true }: FloatingTOCProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tocContentRef = useRef<HTMLElement>(null)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 将扁平 TOC 转换为树形结构
  const tree = useMemo(() => {
    if (!toc || toc.length === 0) return []

    const root: HeadingNode[] = []
    const stack: HeadingNode[] = []

    toc.forEach((h) => {
      const node: HeadingNode = { ...h, children: [] }
      while (stack.length && stack[stack.length - 1].depth >= h.depth) {
        stack.pop()
      }
      if (stack.length === 0) {
        root.push(node)
      } else {
        stack[stack.length - 1].children.push(node)
      }
      stack.push(node)
    })

    return root
  }, [toc])

  // 处理移动端折叠/展开
  const handleMobileToggle = useCallback(() => {
    setIsMobileExpanded((prev) => !prev)
  }, [])

  // 处理桌面端折叠/展开
  const handleDesktopToggle = useCallback(() => {
    setIsDesktopExpanded((prev) => !prev)
  }, [])

  // 处理链接点击
  const handleLinkClick = useCallback((slug: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const id = slug.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // 移动端点击后自动关闭
      if (isMobile) {
        setIsMobileExpanded(false)
      }
    }
  }, [isMobile])

  // 创建 ID 到链接的映射
  const idToLinkMap = useMemo(() => {
    const map = new Map<string, HTMLAnchorElement>()
    if (containerRef.current) {
      const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
      links.forEach((link) => {
        const href = link.getAttribute('href')
        if (href && href.startsWith('#')) {
          const id = href.substring(1)
          map.set(id, link)
        }
      })
    }
    return map
  }, [tree])

  // IntersectionObserver 监听标题
  useEffect(() => {
    if (!toc || toc.length === 0) return

    const headingElements = Array.from(
      document.querySelectorAll<HTMLElement>('main h1[id], main h2[id], main h3[id]')
    )

    if (headingElements.length === 0) return

    const observerOptions = {
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.1, 0.25, 0.5] as number[],
    }

    const headingObserver = new IntersectionObserver((entries) => {
      const visibleHeadings = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => ({
          id: entry.target.id,
          ratio: entry.intersectionRatio,
          top: entry.boundingClientRect.top,
        }))
        .sort((a, b) => {
          if (Math.abs(a.ratio - b.ratio) > 0.1) return b.ratio - a.ratio
          return a.top - b.top
        })

      if (visibleHeadings.length > 0) {
        const topHeadingId = visibleHeadings[0].id
        if (topHeadingId !== activeHeadingId) {
          setActiveHeadingId(topHeadingId)

          // 移除所有 active 类
          if (containerRef.current) {
            const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
            links.forEach((link) => link.classList.remove('active'))
          }

          // 添加 active 类到当前链接
          const activeLink = idToLinkMap.get(topHeadingId)
          if (activeLink) {
            activeLink.classList.add('active')

            // 滚动到可见位置
            const tocContainer = tocContentRef.current
            if (tocContainer && !tocContainer.classList.contains('collapsed')) {
              const linkRect = activeLink.getBoundingClientRect()
              const containerRect = tocContainer.getBoundingClientRect()
              if (linkRect.bottom > containerRect.bottom || linkRect.top < containerRect.top) {
                activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
              }
            }
          }
        }
      }
    }, observerOptions)

    headingElements.forEach((heading) => {
      headingObserver.observe(heading)
    })

    // 初始激活状态
    const initActiveState = () => {
      const hash = window.location.hash.substring(1)
      if (hash && idToLinkMap.has(hash)) {
        const link = idToLinkMap.get(hash)
        if (link) {
          if (containerRef.current) {
            const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
            links.forEach((l) => l.classList.remove('active'))
          }
          link.classList.add('active')
          setActiveHeadingId(hash)
          return
        }
      }

      const visibleHeadingsInit = headingElements.filter((heading) => {
        const rect = heading.getBoundingClientRect()
        return rect.top >= 0 && rect.top <= window.innerHeight / 2
      })

      if (visibleHeadingsInit.length > 0) {
        const topHeading = visibleHeadingsInit[0]
        const link = idToLinkMap.get(topHeading.id)
        if (link) {
          if (containerRef.current) {
            const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
            links.forEach((l) => l.classList.remove('active'))
          }
          link.classList.add('active')
          setActiveHeadingId(topHeading.id)
        }
      } else if (headingElements.length > 0) {
        const firstHeading = headingElements[0]
        const link = idToLinkMap.get(firstHeading.id)
        if (link) {
          if (containerRef.current) {
            const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
            links.forEach((l) => l.classList.remove('active'))
          }
          link.classList.add('active')
          setActiveHeadingId(firstHeading.id)
        }
      }
    }

    setTimeout(initActiveState, 100)

    // 监听 hash 变化
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash && idToLinkMap.has(hash)) {
        const link = idToLinkMap.get(hash)
        if (link) {
          if (containerRef.current) {
            const links = containerRef.current.querySelectorAll<HTMLAnchorElement>('.toc-link')
            links.forEach((l) => l.classList.remove('active'))
          }
          link.classList.add('active')
          setActiveHeadingId(hash)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      headingObserver.disconnect()
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [toc, idToLinkMap, activeHeadingId])

  // 获取深度样式类
  const getDepthClass = useCallback((depth: number) => {
    switch (depth) {
      case 1:
        return styles.depth1
      case 2:
        return styles.depth2
      case 3:
        return styles.depth3
      default:
        return styles.depth3
    }
  }, [])

  // 渲染目录节点
  const renderTOCNode = useCallback(
    (node: HeadingNode): React.ReactNode => {
      return (
        <li key={node.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(node.depth))}>
          <a
            href={node.url}
            data-depth={node.depth}
            className={cn('toc-link', 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800 dark:active:text-indigo-400 dark:active:bg-gray-800')}
            onClick={(e) => handleLinkClick(node.url, e)}
          >
            {node.value}
          </a>
          {node.children.length > 0 && (
            <ul>
              {node.children.map((c: HeadingNode) => (
                <li key={c.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(c.depth))}>
                    <a
                      href={c.url}
                      data-depth={c.depth}
                      className={cn('toc-link', 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800 dark:active:text-indigo-400 dark:active:bg-gray-800')}
                      onClick={(e) => handleLinkClick(c.url, e)}
                    >
                      {c.value}
                    </a>
                  {c.children.length > 0 && (
                    <ul>
                      {c.children.map((cc: HeadingNode) => (
                        <li key={cc.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(cc.depth))}>
                            <a
                              href={cc.url}
                              data-depth={cc.depth}
                              className={cn('toc-link', 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800 dark:active:text-indigo-400 dark:active:bg-gray-800')}
                              onClick={(e) => handleLinkClick(cc.url, e)}
                            >
                              {cc.value}
                            </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      )
    },
    [handleLinkClick, getDepthClass]
  )

  // 如果未启用，不渲染
  if (!enabled) {
    return null
  }

  // 如果没有目录数据或目录为空，不渲染
  if (!toc || !Array.isArray(toc) || toc.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className={styles.tocContainer}>
      {/* 移动端头部 */}
      <div className={styles.tocHeader}>
        <button
          id="toc-toggle"
          onClick={handleMobileToggle}
          aria-expanded={isMobileExpanded}
          aria-controls="toc-content"
          className={cn(styles.tocToggle, 'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:border-indigo-400')}
        >
          <span className="font-brand text-lg">TOC</span>
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
            className={cn(styles.chevronDown, isMobileExpanded && 'rotate-180')}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* 桌面端标题 */}
      <div className={cn(styles.tocTitle, 'dark:border-gray-700')}>
        <span className={cn(styles.tocTitleText, 'font-brand text-base dark:text-gray-100')}>TOC</span>
        <button
          id="toc-toggle-desktop"
          className={cn(styles.tocToggleDesktop, 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800')}
          onClick={handleDesktopToggle}
          aria-expanded={isDesktopExpanded}
          aria-controls="toc-content"
          aria-label="Toggle table of contents"
        >
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
            className={cn(styles.chevronUp, isDesktopExpanded ? 'rotate-0' : 'rotate-180')}
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>

      {/* 目录内容 */}
      <nav
        ref={tocContentRef}
        id="toc-content"
        className={cn(
          styles.toc,
          isMobileExpanded && styles.expanded,
          !isDesktopExpanded && styles.collapsed
        )}
        aria-label="TOC"
      >
        <ul>{tree.map((node) => renderTOCNode(node))}</ul>
      </nav>
    </div>
  )
}

FloatingTOC.displayName = 'FloatingTOC'

// 优化：自定义比较函数，只在 toc 或 enabled 变化时重新渲染
export default memo(FloatingTOC, (prevProps, nextProps) => {
  // 如果 enabled 变化，需要重新渲染
  if (prevProps.enabled !== nextProps.enabled) return false

  // 如果 toc 引用相同，不需要重新渲染
  if (prevProps.toc === nextProps.toc) return true

  // 如果 toc 都是 undefined 或 null，不需要重新渲染
  if (!prevProps.toc && !nextProps.toc) return true

  // 如果 toc 长度不同，需要重新渲染
  if (prevProps.toc?.length !== nextProps.toc?.length) return false

  // 深度比较 toc 内容（只比较前几个关键字段，避免全量比较）
  if (prevProps.toc && nextProps.toc) {
    const maxCheck = Math.min(prevProps.toc.length, nextProps.toc.length, 10) // 只检查前10项
    for (let i = 0; i < maxCheck; i++) {
      const prev = prevProps.toc[i]
      const next = nextProps.toc[i]
      if (prev?.url !== next?.url || prev?.value !== next?.value || prev?.depth !== next?.depth) {
        return false
      }
    }
  }

  return true
})
