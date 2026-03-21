import { useState, useCallback, useRef, useEffect } from 'react'
import type { TOC } from '@/lib/types/toc'

/**
 * TOC 导航逻辑 Hook
 * 处理 TOC 树的构建、链接点击等导航相关逻辑
 */
export function useTOCNavigation(toc?: TOC) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const isMobileRef = useRef(false)

  // 同步 ref
  useEffect(() => {
    isMobileRef.current = isMobile
  }, [isMobile])

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 将扁平 TOC 转换为树形结构
  const buildTree = useCallback((tocItems: TOC) => {
    if (!tocItems || tocItems.length === 0) return []

    const root: any[] = []
    const stack: any[] = []

    tocItems.forEach((h) => {
      const node = { ...h, children: [] }
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
  }, [])

  const tree = buildTree(toc || [])

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
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileExpanded(false)
      }
    }
  }, [])

  return {
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
  }
}
