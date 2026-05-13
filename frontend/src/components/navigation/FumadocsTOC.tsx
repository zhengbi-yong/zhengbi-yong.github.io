'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { List } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import type { TOC } from '@/lib/types/toc'

interface FumadocsTOCProps {
  toc: TOC
}

/**
 * Fumadocs 风格的博客文章 TOC
 *
 * Visual style mirrors fumadocs-core TOC (sticky sidebar, border-s, data-[active] classes),
 * but uses scroll-based heading detection instead of IntersectionObserver for reliability
 * with async-rendered MDX content.
 */
export function FumadocsTOC({ toc }: FumadocsTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const tocRef = useRef(toc)
  tocRef.current = toc

  // Scroll-based active heading detection
  useEffect(() => {
    const tocIds = tocRef.current.map((item) => item.url.replace('#', ''))
    if (tocIds.length === 0) return

    const findActiveHeading = () => {
      const halfway = window.innerHeight / 2

      let bestId: string | null = null
      let bestDistance = Infinity

      for (const id of tocIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        // Only consider headings that are at or above the halfway point
        if (rect.top <= halfway) {
          const distance = halfway - rect.top
          if (distance < bestDistance) {
            bestDistance = distance
            bestId = id
          }
        }
      }

      // Fallback: first heading
      if (!bestId) bestId = tocIds[0]

      setActiveId((prev) => (prev !== bestId ? bestId : prev))
    }

    // Initial check after a brief delay (wait for MDXRemote render)
    const initTimer = setTimeout(findActiveHeading, 300)

    window.addEventListener('scroll', findActiveHeading, { passive: true })
    return () => {
      clearTimeout(initTimer)
      window.removeEventListener('scroll', findActiveHeading)
    }
  }, []) // stable: tocIds read from ref, not state

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault()
    const id = url.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  if (!toc || toc.length === 0) {
    return null
  }

  return (
    <div className="sticky top-24 flex flex-col gap-2 pt-8">
      {/* TOC 标题 */}
      <div className="flex items-center gap-2 mb-2">
        <List size={14} className="text-fd-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-fd-muted-foreground">
          目录
        </span>
      </div>

      {/* TOC 条目 — fumadocs 官方样式 */}
      <nav className="flex flex-col border-s border-fd-foreground/10">
        {toc.map((item) => {
          const itemId = item.url.replace('#', '')
          const isActive = activeId === itemId

          return (
            <a
              key={item.url}
              href={item.url}
              data-active={isActive}
              data-depth={item.depth}
              onClick={(e) => handleClick(e, item.url)}
              className={cn(
                'prose py-1.5 text-sm text-fd-muted-foreground scroll-m-4 transition-colors wrap-anywhere',
                'first:pt-0 last:pb-0',
                'data-[active=true]:text-[var(--theme-accent)] data-[active=true]:font-semibold data-[active=true]:border-l-[3px] data-[active=true]:border-[var(--theme-accent)] data-[active=true]:-ms-px',
                'hover:text-fd-accent-foreground',
                item.depth <= 2 && 'ps-3',
                item.depth === 3 && 'ps-6',
                item.depth >= 4 && 'ps-8',
              )}
            >
              {item.title}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

FumadocsTOC.displayName = 'FumadocsTOC'
