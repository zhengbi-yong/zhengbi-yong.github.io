'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { List } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import styles from './TOC.module.css'
import type { TableOfContentsProps } from './types'
import { useTOCNavigation } from './useTOCNavigation'
import { useHeadingObserver } from './useHeadingObserver'
import { TOCTree } from './TOCTree'

/**
 * TableOfContents - 目录组件
 *
 * 桌面端 TOC 使用 position:fixed + JS 滚动同步：
 * - 监听 .surface-shell 的 scroll 事件，动态计算 top
 *   （使其始终跟随 .surface-shell 滚动，与视口平齐）
 * - right 基于 .monograph-grid 的实际右边界计算（固定在 sidenote 列内）
 * - max-height: 屏幕的 2/3，超长时 overflow-y: auto 滚动
 *
 * 移动端使用 sticky/fixed 方式，由 .surface-shell 的 overflow:auto 容器承载。
 */
export function TableOfContents({ toc, enabled = true, mobileOnly = false }: TableOfContentsProps) {
  const [mounted, setMounted] = useState(false)
  const tocContentRef = useRef<HTMLElement>(null)
  const tocMobileContentRef = useRef<HTMLElement>(null)
  const { resolvedTheme: _resolvedTheme } = useTheme()
  void _resolvedTheme

  // JS-driven sticky state
  // tocTop is always constant '100px' — fixed positioning locks the element 100px from viewport top
  const tocTop = '100px'
  const [tocRight, setTocRight] = useState('0px')
  const [tocVisible, setTocVisible] = useState(false)

  // 导航逻辑
  const {
    isMobileExpanded,
    setIsMobileExpanded,
    isMobile,
    isMobileRef,
    activeHeadingId,
    setActiveHeadingId,
    tree,
    handleMobileToggle,
    handleBackdropClick,
    handleLinkClick,
  } = useTOCNavigation(toc)

  // 滚动监听
  useHeadingObserver({
    toc,
    activeHeadingId,
    isMobileRef,
    isMobileExpanded,
    setActiveHeadingId,
    tocMobileContentRef,
    _tocContentRef: tocContentRef,
  })

  // JS-driven sticky: position:fixed + scroll-synced top/right + visibility
  // position:fixed always locks TOC at top:100px from viewport.
  // tocVisible=false hides it when outside article boundaries (header area / footer area).
  // Uses RAF polling instead of scroll events to ensure reliability across all browsers/environments.
  useEffect(() => {
    if (!mounted || isMobile) return undefined

    let rafId: number
    let lastScrollY = -1

    const updatePosition = () => {
      const grid = document.querySelector('.monograph-grid') as HTMLElement | null
      if (!grid) return

      const scrollY = window.scrollY
      if (scrollY === lastScrollY) return
      lastScrollY = scrollY

      const gridRect = grid.getBoundingClientRect()
      const headerHeight = gridRect.top
      const gridBottom = gridRect.bottom
      const viewportHeight = window.innerHeight

      const showTOC = scrollY > Math.max(0, headerHeight - 20)
      const hideForFooter = gridBottom < viewportHeight + 10

      setTocVisible(showTOC && !hideForFooter)
      const right = window.innerWidth - gridRect.right
      setTocRight(`${right}px`)
    }

    const loop = () => {
      updatePosition()
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [mounted, isMobile])

  // 只负责让 Portal 知道 DOM 已挂载，不影响渲染逻辑
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果未启用或没有目录数据，不渲染任何内容
  if (!enabled || !toc || !Array.isArray(toc) || toc.length === 0) {
    return null
  }

  // 桌面端 TOC 的渲染不依赖 mounted（mounted 只控制 Portal 是否挂载到 document.body）
  // isMobile 在客户端通过 useState 初始化函数同步设置为正确值，不会闪现
  const desktopTOC = !mobileOnly && !isMobile ? (
    <div
      className={styles.tocContainer}
      style={{
        position: 'fixed',
        top: tocTop,
        right: tocRight,
        opacity: tocVisible ? 1 : 0,
        pointerEvents: tocVisible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}
    >
      <div className={styles.tocTitle}>
        <div className="flex items-center gap-2">
          <List size={16} className="text-gray-400 dark:text-gray-500" />
          <span className={cn(styles.tocTitleText, 'dark:text-gray-300')}>目录</span>
        </div>
      </div>
      <nav ref={tocContentRef} id="toc-content" className={styles.toc} aria-label="目录">
        <TOCTree tree={tree} activeHeadingId={activeHeadingId} onLinkClick={handleLinkClick} />
      </nav>
    </div>
  ) : null

  return mounted ? createPortal((
    <>
      {/* 桌面端 TOC */}
      {desktopTOC}

      {/* 移动端浮动按钮 — 仅移动端渲染 */}
      {isMobile && (
        <button
          onClick={handleMobileToggle}
          aria-expanded={isMobileExpanded}
          aria-label="Toggle table of contents"
          className={cn(
            styles.tocFloatingButton,
            'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
          )}
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
      )}

      {/* 移动端遮罩层 */}
      {isMobileExpanded && (
        <div className={styles.tocBackdrop} onClick={handleBackdropClick} aria-hidden="true" />
      )}

      {/* 移动端浮动面板 — 仅移动端渲染 */}
      {isMobile && (
        <div className={cn(styles.tocMobilePanel, isMobileExpanded && styles.tocMobilePanelOpen)}>
        <div className={styles.tocMobilePanelHeader}>
          <span className={cn(styles.tocMobilePanelTitle, 'font-brand dark:text-gray-100')}>
            目录
          </span>
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
          <TOCTree tree={tree} activeHeadingId={activeHeadingId} onLinkClick={handleLinkClick} />
        </nav>
      </div>
      )}
    </>
  ), document.body) : null
}

TableOfContents.displayName = 'TableOfContents'

export default TableOfContents
