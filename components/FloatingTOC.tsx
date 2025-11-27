'use client'

import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { useActiveHeading } from './hooks/useActiveHeading'
import type { TOC, TOCItem } from '@/lib/types/toc'
import { Menu, X } from 'lucide-react'

interface FloatingTOCProps {
  toc?: TOC
  enabled?: boolean
}

interface TOCNode extends TOCItem {
  children?: TOCNode[]
}

/**
 * FloatingTOC - 浮动目录组件
 * 在桌面端显示为右侧固定面板，移动端显示为可折叠的抽屉
 */
function FloatingTOC({ toc, enabled = true }: FloatingTOCProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端（使用媒体查询优化性能）
  // 使用 md breakpoint (768px)，让中等大小的窗口也能显示目录
  useEffect(() => {
    // 使用 matchMedia 而不是 resize 事件，性能更好
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const checkMobile = () => {
      setIsMobile(!mediaQuery.matches)
    }
    
    // 初始检查
    checkMobile()
    
    // 使用现代 API，支持 addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkMobile)
      return () => mediaQuery.removeEventListener('change', checkMobile)
    } else {
      // 降级方案：使用 resize 事件（带防抖）
      let timeoutId: NodeJS.Timeout
      const handleResize = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(checkMobile, 150)
      }
      window.addEventListener('resize', handleResize, { passive: true })
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  // 将扁平 TOC 转换为树形结构（优化：减少对象复制）
  const tocTree = useMemo(() => {
    if (!toc || toc.length === 0) return []

    const tree: TOCNode[] = []
    const stack: TOCNode[] = []

    // 使用 for 循环而不是 forEach，性能更好
    for (let i = 0; i < toc.length; i++) {
      const item = toc[i]
      const node: TOCNode = { ...item }

      // 找到当前节点的父节点（优化：只弹出必要的节点）
      while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
        stack.pop()
      }

      if (stack.length === 0) {
        tree.push(node)
      } else {
        const parent = stack[stack.length - 1]
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
      }

      stack.push(node)
    }

    return tree
  }, [toc])

  // 获取所有标题 ID（优化：使用 for 循环）
  const headingIds = useMemo(() => {
    if (!toc || toc.length === 0) return []
    const ids: string[] = new Array(toc.length)
    for (let i = 0; i < toc.length; i++) {
      ids[i] = toc[i].url
    }
    return ids
  }, [toc])

  // 获取当前激活的标题
  const activeId = useActiveHeading(headingIds)

  // 处理点击跳转
  const handleClick = useCallback((url: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const id = url.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80 // Header 高度偏移
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // 移动端点击后自动关闭
      if (isMobile) {
        setIsOpen(false)
      }
    }
  }, [isMobile])

  // 渲染目录节点（使用 useCallback 优化性能，缓存 className）
  const renderTOCNode = useCallback(
    (node: TOCNode, level: number = 0): React.ReactNode => {
      const isActive = activeId === node.url
      // 缓存 className，避免每次渲染都重新计算
      const linkClassName = isActive
        ? 'block py-1.5 px-2 text-sm transition-colors rounded-md text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20'
        : 'block py-1.5 px-2 text-sm transition-colors rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'

      return (
        <li key={node.url}>
          <a
            href={node.url}
            onClick={(e) => handleClick(node.url, e)}
            className={linkClassName}
            style={{ paddingLeft: `${level * 0.75 + 0.5}rem` }}
          >
            {node.value}
          </a>
          {node.children && node.children.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {node.children.map((child) => renderTOCNode(child, level + 1))}
            </ul>
          )}
        </li>
      )
    },
    [activeId, handleClick]
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
    <>
      {/* 移动端折叠按钮 */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed right-8 bottom-24 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label={isOpen ? '关闭目录' : '打开目录'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* 目录面板 - 移动端：固定定位抽屉，桌面端：正常显示 */}
      <aside
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:h-auto md:w-full md:shadow-none md:transform-none md:bg-transparent dark:md:bg-transparent ${
          isMobile
            ? isOpen
              ? 'translate-x-0'
              : 'translate-x-full'
            : 'translate-x-0'
        } md:translate-x-0 md:max-h-[calc(100vh-5rem)] md:overflow-y-auto`}
        role="navigation"
        aria-label="文章目录"
      >
        <div className={`${isMobile ? 'p-6' : 'md:pl-6 md:pr-2'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            目录
          </h2>
          <nav>
            <ul className="space-y-0.5">{tocTree.map((node) => renderTOCNode(node))}</ul>
          </nav>
        </div>
      </aside>

      {/* 移动端遮罩层 */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
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

