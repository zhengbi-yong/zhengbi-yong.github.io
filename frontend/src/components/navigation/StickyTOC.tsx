'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/components/lib/utils'

interface Heading {
  id: string
  text: string
  level: number // 2, 3, or 4
}

interface StickyTOCProps {
  contentRef: React.RefObject<HTMLElement | null> // ref to the prose content container
  className?: string
}

const MAX_HEADING_TEXT_LENGTH = 60

export default function StickyTOC({ contentRef, className = '' }: StickyTOCProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const headingElementsRef = useRef<HTMLElement[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Extract headings from the DOM on mount
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const elements = container.querySelectorAll<HTMLHeadingElement>('h2, h3, h4')
    const extracted: Heading[] = []
    const elRefs: HTMLElement[] = []

    elements.forEach((el) => {
      const id = el.id
      if (!id) return // Skip headings without an id

      const text = el.textContent?.trim() || ''
      const level = parseInt(el.tagName[1], 10)

      extracted.push({
        id,
        text: text.length > MAX_HEADING_TEXT_LENGTH
          ? text.slice(0, MAX_HEADING_TEXT_LENGTH) + '...'
          : text,
        level,
      })
      elRefs.push(el)
    })

    setHeadings(extracted)
    headingElementsRef.current = elRefs
  }, [contentRef])

  // Smooth scroll to heading
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Set up IntersectionObserver for scroll-spy
  useEffect(() => {
    const elements = headingElementsRef.current
    if (elements.length === 0) return undefined

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Collect all currently intersecting entries
        const intersecting = entries.filter((entry) => entry.isIntersecting)

        if (intersecting.length > 0) {
          // Pick the topmost intersecting heading (smallest top value)
          const topmost = intersecting.reduce((prev, current) => {
            const prevTop = prev.boundingClientRect.top
            const currentTop = current.boundingClientRect.top
            return currentTop < prevTop ? current : prev
          })

          const id = (topmost.target as HTMLElement).id
          if (id) {
            setActiveId(id)
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 1,
      }
    )

    observerRef.current = observer

    elements.forEach((el) => observer.observe(el))

    // Set initial active heading based on scroll position
    const initActive = () => {
      const scrollPos = window.scrollY + 100
      let currentId: string | null = null

      for (let i = elements.length - 1; i >= 0; i--) {
        const rect = elements[i].getBoundingClientRect()
        const elTop = window.scrollY + rect.top
        if (elTop <= scrollPos) {
          currentId = elements[i].id
          break
        }
      }

      if (currentId) {
        setActiveId(currentId)
      } else if (elements.length > 0) {
        setActiveId(elements[0].id)
      }
    }

    initActive()

    return () => {
      observer.disconnect()
    }
  }, [headings])

  // Handle heading click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      scrollTo(id)
    },
    [scrollTo]
  )

  // Don't render if no content ref or no headings
  if (!contentRef.current || headings.length === 0) {
    return null
  }

  return (
    <nav className={cn('hidden lg:block', className)} aria-label="Table of contents">
      <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
        目录
      </h4>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                'block text-sm py-1 transition-colors duration-200',
                'text-muted-foreground hover:text-foreground',
                heading.level === 2 && 'pl-0',
                heading.level === 3 && 'pl-3',
                heading.level === 4 && 'pl-6',
                activeId === heading.id
                  ? 'text-foreground font-medium border-l-2 border-accent pl-2'
                  : 'border-l-2 border-transparent pl-2'
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
