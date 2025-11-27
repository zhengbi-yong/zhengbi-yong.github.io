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
const FloatingTOC = memo(function FloatingTOC({ toc, enabled = true }: FloatingTOCProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280) // xl breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 将扁平 TOC 转换为树形结构
  const tocTree = useMemo(() => {
    if (!toc || toc.length === 0) return []

    const tree: TOCNode[] = []
    const stack: TOCNode[] = []

    toc.forEach((item) => {
      const node: TOCNode = { ...item }

      // 找到当前节点的父节点
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
    })

    return tree
  }, [toc])

  // 获取所有标题 ID
  const headingIds = useMemo(() => {
    if (!toc) return []
    return toc.map((item) => item.url)
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

  // 渲染目录节点
  const renderTOCNode = useCallback((node: TOCNode, level: number = 0): React.ReactNode => {
    const isActive = activeId === node.url

    return (
      <li key={node.url}>
        <a
          href={node.url}
          onClick={(e) => handleClick(node.url, e)}
          className={`block py-1.5 px-2 text-sm transition-colors rounded-md ${
            isActive
              ? 'text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
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
  }, [activeId, handleClick])

  // 调试信息（始终输出，即使在服务端）
  console.log('[FloatingTOC] Component called:', {
    enabled,
    hasToc: !!toc,
    tocType: typeof toc,
    tocIsArray: Array.isArray(toc),
    tocLength: Array.isArray(toc) ? toc.length : 'N/A',
    isClient: typeof window !== 'undefined',
  })

  // 如果未启用，不渲染
  if (!enabled) {
    console.log('[FloatingTOC] Disabled - returning null')
    return null
  }

  // 如果没有目录数据或目录为空，不渲染
  if (!toc || !Array.isArray(toc) || toc.length === 0) {
    console.log('[FloatingTOC] No TOC data - returning null:', {
      toc,
      isArray: Array.isArray(toc),
      length: toc?.length,
    })
    return null
  }

  // 调试信息
  console.log('[FloatingTOC] Rendering TOC:', {
    tocLength: toc.length,
    enabled,
    isMobile: typeof window !== 'undefined' ? isMobile : 'SSR',
  })

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

      {/* 目录面板 */}
      <aside
        className={`${
          isMobile
            ? `fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
              }`
            : 'xl:block xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto xl:w-full'
        }`}
        role="navigation"
        aria-label="文章目录"
      >
        <div className={`${isMobile ? 'p-6' : 'xl:pl-6 xl:pr-2'}`}>
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
})

FloatingTOC.displayName = 'FloatingTOC'

export default FloatingTOC

