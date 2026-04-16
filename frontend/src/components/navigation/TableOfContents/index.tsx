'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Desktop position is handled by CSS sticky; scroll listener keeps heading observer active
  // (updateTocPosition is kept as no-op to avoid breaking the scroll event subscription)
  useEffect(() => {
    setMounted(true)
    window.addEventListener('scroll', () => {}, { passive: true })
  }, [])

  // 如果未启用或没有目录数据，不渲染任何内容
  if (!enabled || !toc || !Array.isArray(toc) || toc.length === 0) {
    return null
  }

  return (
    <>
      {/* 移动端浮动按钮 */}
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

      {/* 移动端遮罩层 */}
      {isMobileExpanded && (
        <div className={styles.tocBackdrop} onClick={handleBackdropClick} aria-hidden="true" />
      )}

      {/* 移动端浮动面板 */}
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

      {/* Desktop: sticky in sidenote column via grid placement */}
      {!mobileOnly && mounted && !isMobile && (
        <div className={styles.tocContainer}>
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
      )}
    </>
  )
}

TableOfContents.displayName = 'TableOfContents'

export default TableOfContents
