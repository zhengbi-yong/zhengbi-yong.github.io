'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
 * 桌面端 TOC：直接渲染在 DOM 中（不通过 Portal），
 * 位于 .monograph-toc-aside（grid column 3）内，
 * 通过 CSS `position: sticky` 保持在视口内。
 * 3列 grid 布局（content | 40px gap | 220px TOC）保证 TOC 永不遮挡正文。
 *
 * 移动端：FAB 按钮 + 底部面板，通过 Portal 渲染到 document.body，
 * 使用 `position: fixed` 相对于视口定位。
 */
export function TableOfContents({ toc, enabled = true, mobileOnly = false }: TableOfContentsProps) {
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const tocContentRef = useRef<HTMLDivElement>(null)
  const tocMobileContentRef = useRef<HTMLElement>(null)

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

  // 滚动监听 — 负责更新 active heading + 阅读进度 + TOC 自动滚动
  useHeadingObserver({
    toc,
    activeHeadingId,
    isMobileRef,
    isMobileExpanded,
    setActiveHeadingId,
    tocMobileContentRef,
    _tocContentRef: tocContentRef,
    tocContainerRef: tocContentRef,
    onProgressChange: setProgress,
  })

  // mounted — 仅用于移动端 Portal，不影响桌面端 TOC（直接 DOM 渲染）
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果未启用或没有目录数据，不渲染任何内容
  if (!enabled || !toc || !Array.isArray(toc) || toc.length === 0) {
    return null
  }

  // 桌面端 TOC — 直接渲染在 DOM 中（不走 Portal）
  // 样式由 CSS `.monograph-toc-aside` 的 sticky 定位处理
  const desktopTOC = !mobileOnly && !isMobile ? (
    <div className={styles.tocContainer} ref={tocContentRef}>
      {/* 阅读进度条 */}
      <div className={styles.tocProgressBar} aria-hidden="true">
        <div
          className={styles.tocProgressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.tocTitle}>
        <div className="flex items-center gap-2">
          <List size={16} className="text-gray-400 dark:text-gray-500" />
          <span className={cn(styles.tocTitleText, 'dark:text-gray-300')}>目录</span>
        </div>
        <span className={cn(styles.tocProgressLabel, 'dark:text-gray-500')}>
          {Math.round(progress)}%
        </span>
      </div>
      <nav id="toc-content" className={styles.toc} aria-label="目录">
        <TOCTree tree={tree} activeHeadingId={activeHeadingId} onLinkClick={handleLinkClick} />
      </nav>
    </div>
  ) : null

  // 移动端 FAB + 面板 — 通过 Portal 渲染到 document.body
  // `position: fixed` 需要参照 viewport，只有 Portal 能实现
  const mobileElements = isMobile ? (
    <>
      {/* 浮动按钮 */}
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

      {/* 遮罩层 */}
      {isMobileExpanded && (
        <div className={styles.tocBackdrop} onClick={handleBackdropClick} aria-hidden="true" />
      )}

      {/* 底部面板 */}
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
    </>
  ) : null

  // 桌面端 TOC 直接在 DOM 中渲染（不走 Portal）
  // 移动端 FAB + 面板通过 Portal 渲染到 document.body
  return (
    <>
      {desktopTOC}
      {mounted && createPortal(mobileElements, document.body)}
    </>
  )
}

TableOfContents.displayName = 'TableOfContents'

export default TableOfContents
