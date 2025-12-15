'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * useActiveHeading - 监听当前激活的标题 Hook
 * 使用 IntersectionObserver 检测哪个标题当前在视口中
 */
export function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const headingElementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // 更新激活的标题（使用缓存的元素引用，避免重复查找）
  const updateActiveHeading = useCallback(() => {
    if (headingIds.length === 0 || headingElementsRef.current.size === 0) return

    // 使用缓存的元素引用，避免重复查找 DOM
    const headingPositions: Array<{ id: string; element: HTMLElement; top: number }> = []
    headingElementsRef.current.forEach((element, id) => {
      if (element && element.isConnected) {
        headingPositions.push({
          id,
          element,
          top: element.getBoundingClientRect().top,
        })
      }
    })

    if (headingPositions.length === 0) return

    // 找到最接近视口顶部但还未滚过的标题
    const scrollPosition = window.scrollY + 100 // 偏移量，提前激活
    let currentActive = headingIds[0]

    for (let i = headingPositions.length - 1; i >= 0; i--) {
      const heading = headingPositions[i]
      const elementTop = heading.element.offsetTop

      if (elementTop <= scrollPosition) {
        currentActive = heading.id
        break
      }
    }

    setActiveId((prev) => (prev !== currentActive ? currentActive : prev))
  }, [headingIds])

  useEffect(() => {
    if (headingIds.length === 0) return

    // 存储所有标题元素
    headingElementsRef.current.clear()
    headingIds.forEach((id) => {
      const element = document.getElementById(id.replace('#', ''))
      if (element) {
        headingElementsRef.current.set(id, element)
      }
    })

    // 创建 IntersectionObserver
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px', // 标题在视口上方 20% 时激活
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      // 找到所有正在交叉的标题
      const intersectingEntries = entries.filter((entry) => entry.isIntersecting)

      if (intersectingEntries.length > 0) {
        // 选择最接近顶部的标题（优化：只排序必要的条目）
        let topEntry = intersectingEntries[0]
        let minTop = topEntry.boundingClientRect.top

        for (let i = 1; i < intersectingEntries.length; i++) {
          const entry = intersectingEntries[i]
          const top = entry.boundingClientRect.top
          if (top < minTop) {
            minTop = top
            topEntry = entry
          }
        }

        const id = '#' + topEntry.target.id
        if (headingIds.includes(id)) {
          setActiveId((prev) => (prev !== id ? id : prev))
        }
      } else {
        // 如果没有交叉的标题，使用滚动位置判断
        updateActiveHeading()
      }
    }, observerOptions)

    // 观察所有标题元素
    headingElementsRef.current.forEach((element) => {
      observerRef.current?.observe(element)
    })

    // 初始更新
    updateActiveHeading()

    // 监听滚动事件作为后备方案（使用防抖优化性能）
    const handleScroll = () => {
      // 清除之前的 timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 使用 requestAnimationFrame 节流
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          updateActiveHeading()
          rafIdRef.current = null
        })
      }

      // 防抖：如果快速滚动，延迟执行
      scrollTimeoutRef.current = setTimeout(() => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        updateActiveHeading()
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      headingElementsRef.current.clear()
    }
  }, [headingIds, updateActiveHeading])

  return activeId
}
