'use client'

import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import type { TOC, TOCItem } from '@/lib/types/toc'
import styles from './FloatingTOC.module.css'
import { cn } from './lib/utils'

interface FloatingTOCProps {
  toc?: TOC
  enabled?: boolean
  mobileOnly?: boolean // 如果为 true，只渲染移动端浮动按钮和面板，不渲染桌面端容器
}

interface HeadingNode extends TOCItem {
  children: HeadingNode[]
}

/**
 * FloatingTOC - 浮动目录组件
 * 基于提供的 Astro TOC 组件转换而来
 */
function FloatingTOC({ toc, enabled = true, mobileOnly = false }: FloatingTOCProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const activeHeadingIdRef = useRef<string | null>(null)
  const isMobileRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tocContentRef = useRef<HTMLElement>(null)
  const tocMobileContentRef = useRef<HTMLElement>(null)
  const { resolvedTheme } = useTheme()
  
  // 当组件挂载后，显示 UI
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 检测是否为深色模式
  const isDark = useMemo(() => {
    if (!mounted) {
      // 未挂载时默认浅色模式
      return false
    }
    // 严格使用 resolvedTheme，不检查 DOM
    // 这样可以确保与 next-themes 的主题状态完全一致
    return resolvedTheme === 'dark'
  }, [mounted, resolvedTheme])
  
  // 同步 ref 和 state
  useEffect(() => {
    activeHeadingIdRef.current = activeHeadingId
  }, [activeHeadingId])
  
  useEffect(() => {
    isMobileRef.current = isMobile
  }, [isMobile])

  // 移动端面板打开时，滚动到活动链接
  useEffect(() => {
    if (isMobile && isMobileExpanded && activeHeadingId && tocMobileContentRef.current) {
      setTimeout(() => {
        const activeLink = tocMobileContentRef.current?.querySelector<HTMLAnchorElement>(
          `.toc-link[data-id="${activeHeadingId}"]`
        )
        if (activeLink) {
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }, 100)
    }
  }, [isMobile, isMobileExpanded, activeHeadingId])

  // 检测是否为移动端 - 使用 768px 断点与 Tailwind md: 保持一致
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    // 初始检查
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 在服务器端渲染时，默认不渲染桌面端容器（避免 hydration 问题）
  // 客户端挂载后再根据窗口宽度决定是否渲染
  const [shouldRenderDesktop, setShouldRenderDesktop] = useState(false)
  useEffect(() => {
    setShouldRenderDesktop(window.innerWidth >= 768)
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

  // 处理遮罩层点击关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsMobileExpanded(false)
    }
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

      // 移动端点击后自动关闭（使用窗口宽度判断，不依赖 isMobile 状态）
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileExpanded(false)
      }
    }
  }, [])

  // 创建 ID 到链接的映射（在 useEffect 中动态构建，确保 DOM 已渲染）
  const buildIdToLinkMap = useCallback(() => {
    const map = new Map<string, HTMLAnchorElement>()
    // 优先从移动端面板查找，如果不存在则从桌面端容器查找
    const container = isMobile ? tocMobileContentRef.current : containerRef.current
    if (container) {
      const links = container.querySelectorAll<HTMLAnchorElement>('.toc-link')
      links.forEach((link) => {
        const href = link.getAttribute('href')
        if (href && href.startsWith('#')) {
          const id = href.substring(1)
          map.set(id, link)
        }
      })
    }
    return map
  }, [isMobile])

  // IntersectionObserver 监听标题
  useEffect(() => {
    if (!toc || toc.length === 0) return

    // 延迟初始化，确保 DOM 完全渲染
    const initObserver = () => {
      // 重新构建 idToLinkMap，确保获取最新的链接
      const idToLinkMap = buildIdToLinkMap()
      
      if (idToLinkMap.size === 0) {
        return
      }

      // 尝试多种选择器，确保能找到标题元素
      const selectors = [
        'article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]',
        'main h1[id], main h2[id], main h3[id], main h4[id], main h5[id], main h6[id]',
        '.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id], .prose h5[id], .prose h6[id]',
        'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
      ]

      let headingElements: HTMLElement[] = []
      for (const selector of selectors) {
        headingElements = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (headingElements.length > 0) {
          break
        }
      }

      // 如果还是找不到，尝试查找所有标题（即使没有 id）
      if (headingElements.length === 0) {
        const allHeadings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
        // 尝试从 TOC 数据中获取 ID，然后查找对应的元素
        const tocIds = toc.map((item) => item.url.replace('#', ''))
        headingElements = allHeadings.filter((heading) => {
          const id = heading.id || heading.getAttribute('id')
          return id && tocIds.includes(id)
        })
      }

      if (headingElements.length === 0) {
        return
      }

      // 优化 IntersectionObserver 配置
      // rootMargin: 顶部偏移 120px（考虑固定头部），底部偏移 70%
      // 这样标题在视口上方 120px 到视口下方 30% 之间时会被激活
      const observerOptions = {
        rootMargin: '-120px 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1] as number[],
      }

      // 防抖定时器
      let debounceTimer: NodeJS.Timeout | null = null
      
      const headingObserver = new IntersectionObserver((entries) => {
        // 清除之前的防抖定时器
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }
        
        // 使用防抖，延迟 150ms 执行，减少频繁更新
        debounceTimer = setTimeout(() => {
          // 重新获取最新的 idToLinkMap
          const currentIdToLinkMap = buildIdToLinkMap()
          
          // 找到所有正在交叉的标题
          const intersectingHeadings = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => ({
              id: entry.target.id,
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
              bottom: entry.boundingClientRect.bottom,
              element: entry.target as HTMLElement,
            }))

          if (intersectingHeadings.length > 0) {
            // 改进排序逻辑：优先选择最接近顶部且在视口上方的标题
            const topHeading = intersectingHeadings.reduce((prev, current) => {
              // 优先选择在视口上方（已滚过）的标题
              if (prev.top < 120 && current.top >= 120) return prev
              if (prev.top >= 120 && current.top < 120) return current
              
              // 如果都在视口上方，选择更接近顶部的（top 值更大的）
              if (prev.top < 120 && current.top < 120) {
                return current.top > prev.top ? current : prev
              }
              
              // 如果都在视口内，选择更接近顶部的（top 值更小的）
              if (prev.top >= 120 && current.top >= 120) {
                return current.top < prev.top ? current : prev
              }
              
              return prev
            }, intersectingHeadings[0]) // 提供初始值

            const topHeadingId = topHeading.id
            if (topHeadingId && topHeadingId !== activeHeadingIdRef.current) {
              setActiveHeadingId(topHeadingId)
              
              // 延迟滚动，确保 DOM 已更新
              setTimeout(() => {
                const activeLink = currentIdToLinkMap.get(topHeadingId)
                if (activeLink) {
                  if (isMobileRef.current) {
                    // 移动端：滚动到移动端面板中的可见位置
                    const mobileContainer = tocMobileContentRef.current
                    if (mobileContainer && isMobileExpanded) {
                      activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                    }
                  } else {
                    // 桌面端：滚动到桌面端容器中的可见位置
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
              }, 0)
            }
          } else {
            // 如果没有交叉的标题，使用滚动位置判断（作为后备方案）
          const scrollPosition = window.scrollY + 120
          let currentActive: string | null = null

          // 找到所有标题的位置
          const headingPositions = headingElements.map((heading) => ({
            id: heading.id,
            top: window.scrollY + heading.getBoundingClientRect().top,
          })).sort((a, b) => b.top - a.top) // 从下往上排序

          // 找到最接近但已滚过的标题
          for (const pos of headingPositions) {
            if (pos.top <= scrollPosition) {
              currentActive = pos.id
              break
            }
          }

          // 如果找到了当前激活的标题，更新高亮
          if (currentActive && currentActive !== activeHeadingIdRef.current) {
            setActiveHeadingId(currentActive)
            
            // 延迟滚动，确保 DOM 已更新
            setTimeout(() => {
              const activeLink = currentIdToLinkMap.get(currentActive)
              if (activeLink) {
                if (isMobileRef.current) {
                  // 移动端：滚动到移动端面板中的可见位置
                  const mobileContainer = tocMobileContentRef.current
                  if (mobileContainer && isMobileExpanded) {
                    activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                  }
                } else {
                  // 桌面端：滚动到桌面端容器中的可见位置
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
            }, 0)
          }
        }
        }, 150) // 防抖延迟 150ms
      }, observerOptions)

      headingElements.forEach((heading) => {
        headingObserver.observe(heading)
      })

      // 初始激活状态
      const initActiveState = () => {
        const currentIdToLinkMap = buildIdToLinkMap()
        const hash = window.location.hash.substring(1)
        if (hash && currentIdToLinkMap.has(hash)) {
          setActiveHeadingId(hash)
          return
        }

        // 找到当前视口内最接近顶部的标题
        const visibleHeadingsInit = headingElements
          .map((heading) => ({
            element: heading,
            top: heading.getBoundingClientRect().top,
            id: heading.id,
          }))
          .filter((h) => h.top >= 100 && h.top <= window.innerHeight / 2)
          .sort((a, b) => a.top - b.top)

        if (visibleHeadingsInit.length > 0) {
          const topHeading = visibleHeadingsInit[0]
          setActiveHeadingId(topHeading.id)
        } else if (headingElements.length > 0) {
          // 如果视口内没有标题，选择第一个标题
          const firstHeading = headingElements[0]
          setActiveHeadingId(firstHeading.id)
        }
      }

      setTimeout(initActiveState, 200)

      // 监听 hash 变化
      const handleHashChange = () => {
        const currentIdToLinkMap = buildIdToLinkMap()
        const hash = window.location.hash.substring(1)
        if (hash && currentIdToLinkMap.has(hash)) {
          setActiveHeadingId(hash)
        }
      }

      window.addEventListener('hashchange', handleHashChange)

      // 添加滚动监听作为后备方案（使用节流优化性能）
      let scrollTimeout: NodeJS.Timeout | null = null
      const handleScroll = () => {
        if (scrollTimeout) return
        scrollTimeout = setTimeout(() => {
          // 重新获取最新的 idToLinkMap
          const currentIdToLinkMap = buildIdToLinkMap()
          
          // 找到最接近视口顶部但已滚过的标题
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
            
            // 延迟滚动，确保 DOM 已更新
            setTimeout(() => {
              const activeLink = currentIdToLinkMap.get(currentActive)
              if (activeLink) {
                if (isMobileRef.current) {
                  // 移动端：滚动到移动端面板中的可见位置
                  const mobileContainer = tocMobileContentRef.current
                  if (mobileContainer && isMobileExpanded) {
                    activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                  }
                } else {
                  // 桌面端：滚动到桌面端容器中的可见位置
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
            }, 0)
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

    // 延迟初始化，确保 DOM 完全渲染
    const timeoutId = setTimeout(initObserver, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [toc, buildIdToLinkMap, isMobile])

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
      const nodeId = node.url.replace('#', '')
      const isActive = activeHeadingId === nodeId
      
      return (
        <li key={node.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(node.depth))}>
          <a
            href={node.url}
            data-depth={node.depth}
            data-id={nodeId}
            className={cn(
              'toc-link',
              isActive && 'active',
              !isActive && 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
            )}
            style={isActive ? { 
              color: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)', 
              backgroundColor: isDark ? 'rgb(30 41 59)' : 'rgb(243 244 246)', 
              fontWeight: 600,
              boxShadow: isDark ? '0 1px 3px 0 rgba(129, 140, 248, 0.1)' : '0 1px 3px 0 rgba(99, 102, 241, 0.1)'
            } as React.CSSProperties : undefined}
            onClick={(e) => handleLinkClick(node.url, e)}
          >
            {isActive && <span style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '70%',
              background: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)',
              borderRadius: '0 2px 2px 0',
              boxShadow: isDark ? '0 0 4px rgba(129, 140, 248, 0.5)' : '0 0 4px rgba(99, 102, 241, 0.4)'
            } as React.CSSProperties} />}
            {node.value}
          </a>
          {node.children.length > 0 && (
            <ul>
              {node.children.map((c: HeadingNode) => {
                const childId = c.url.replace('#', '')
                const isChildActive = activeHeadingId === childId
                
                return (
                  <li key={c.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(c.depth))}>
                    <a
                      href={c.url}
                      data-depth={c.depth}
                      data-id={childId}
                      className={cn(
                        'toc-link',
                        isChildActive && 'active',
                        !isChildActive && 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                      )}
                      style={isChildActive ? { 
                        color: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)', 
                        backgroundColor: isDark ? 'rgb(30 41 59)' : 'rgb(243 244 246)', 
                        fontWeight: 600,
                        boxShadow: isDark ? '0 1px 3px 0 rgba(129, 140, 248, 0.1)' : '0 1px 3px 0 rgba(99, 102, 241, 0.1)'
                      } as React.CSSProperties : undefined}
                      onClick={(e) => handleLinkClick(c.url, e)}
                    >
                      {isChildActive && <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '70%',
                        background: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)',
                        borderRadius: '0 2px 2px 0',
                        boxShadow: isDark ? '0 0 4px rgba(129, 140, 248, 0.5)' : '0 0 4px rgba(99, 102, 241, 0.4)'
                      } as React.CSSProperties} />}
                      {c.value}
                    </a>
                    {c.children.length > 0 && (
                      <ul>
                        {c.children.map((cc: HeadingNode) => {
                          const grandChildId = cc.url.replace('#', '')
                          const isGrandChildActive = activeHeadingId === grandChildId
                          
                          return (
                            <li key={cc.url} className={cn(styles.tocItem, 'font-brand', getDepthClass(cc.depth))}>
                              <a
                                href={cc.url}
                                data-depth={cc.depth}
                                data-id={grandChildId}
                                className={cn(
                                  'toc-link',
                                  isGrandChildActive && 'active',
                                  !isGrandChildActive && 'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                                )}
                                style={isGrandChildActive ? { 
                                  color: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)', 
                                  backgroundColor: isDark ? 'rgb(30 41 59)' : 'rgb(243 244 246)', 
                                  fontWeight: 600,
                                  boxShadow: isDark ? '0 1px 3px 0 rgba(129, 140, 248, 0.1)' : '0 1px 3px 0 rgba(99, 102, 241, 0.1)'
                                } as React.CSSProperties : undefined}
                                onClick={(e) => handleLinkClick(cc.url, e)}
                              >
                                {isGrandChildActive && <span style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '3px',
                                  height: '70%',
                                  background: isDark ? 'rgb(129 140 248)' : 'rgb(99 102 241)',
                                  borderRadius: '0 2px 2px 0',
                                  boxShadow: isDark ? '0 0 4px rgba(129, 140, 248, 0.5)' : '0 0 4px rgba(99, 102, 241, 0.4)'
                                } as React.CSSProperties} />}
                                {cc.value}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      )
    },
    [handleLinkClick, getDepthClass, activeHeadingId, isDark]
  )

  // 如果未启用或没有目录数据，不渲染任何内容
  if (!enabled || !toc || !Array.isArray(toc) || toc.length === 0) {
    return null
  }

  return (
    <>
      {/* 移动端浮动按钮和面板 - 始终渲染，由 CSS 控制显示 */}
      <>
        {/* 浮动按钮 */}
        <button
          onClick={handleMobileToggle}
          aria-expanded={isMobileExpanded}
          aria-label="Toggle table of contents"
          className={cn(styles.tocFloatingButton, 'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 遮罩层 */}
        {isMobileExpanded && (
          <div
            className={styles.tocBackdrop}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* 移动端浮动面板 */}
        <div
          className={cn(
            styles.tocMobilePanel,
            isMobileExpanded && styles.tocMobilePanelOpen
          )}
        >
            <div className={styles.tocMobilePanelHeader}>
              <span className={cn(styles.tocMobilePanelTitle, 'font-brand dark:text-gray-100')}>目录</span>
              <button
                onClick={() => setIsMobileExpanded(false)}
                aria-label="Close table of contents"
                className={cn(styles.tocCloseButton, 'dark:text-gray-400 dark:hover:text-gray-200')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav
              ref={tocMobileContentRef}
              id="toc-content-mobile"
              className={styles.tocMobileContent}
              aria-label="TOC"
            >
              <ul>{tree.map((node) => renderTOCNode(node))}</ul>
            </nav>
          </div>
      </>

      {/* 桌面端容器 - 仅在非移动端且非 mobileOnly 模式下渲染 */}
      {!mobileOnly && shouldRenderDesktop && !isMobile && (
        <div ref={containerRef} className={styles.tocContainer}>
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
              !isDesktopExpanded && styles.collapsed
            )}
            aria-label="TOC"
          >
            <ul>{tree.map((node) => renderTOCNode(node))}</ul>
          </nav>
        </div>
      )}
    </>
  )
}

FloatingTOC.displayName = 'FloatingTOC'

// 移除 memo，因为 activeHeadingId 是内部状态，需要触发重新渲染
export default FloatingTOC
