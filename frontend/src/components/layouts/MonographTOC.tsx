'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TOC } from '@/lib/types/toc'

interface MonographTOCProps {
  toc: TOC
}

/**
 * Monograph-style TOC component
 * - Desktop (>=1280px): sidenote column with sticky navigation (CSS hides/shows)
 * - Mobile/Tablet (<1280px): floating FAB + right-side drawer
 * Uses IntersectionObserver for active heading tracking.
 */
export function MonographTOC({ toc }: MonographTOCProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // IntersectionObserver for heading tracking
  useEffect(() => {
    if (!toc || toc.length === 0) return

    const initObserver = () => {
      const selectors = [
        'article h1[id], article h2[id], article h3[id], article h4[id]',
        'main h1[id], main h2[id], main h3[id], main h4[id]',
        '.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id]',
        'h1[id], h2[id], h3[id], h4[id]',
      ]

      let headingElements: HTMLElement[] = []
      for (const selector of selectors) {
        headingElements = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (headingElements.length > 0) break
      }

      if (headingElements.length === 0) return

      const tocIds = new Set(toc.map((item) => item.url.replace('#', '')))
      const filteredHeadings = headingElements.filter((h) => h.id && tocIds.has(h.id))

      if (filteredHeadings.length === 0) return

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

          if (visible.length > 0) {
            const id = visible[0].target.id
            if (id) setActiveId(id)
          }
        },
        {
          rootMargin: '-80px 0px -70% 0px',
          threshold: [0, 0.25, 0.5, 1],
        }
      )

      filteredHeadings.forEach((h) => observer.observe(h))
      observerRef.current = observer

      // Set initial active
      const hash = window.location.hash.substring(1)
      if (hash && tocIds.has(hash)) {
        setActiveId(hash)
      } else if (filteredHeadings.length > 0) {
        setActiveId(filteredHeadings[0].id)
      }
    }

    const timeoutId = setTimeout(initObserver, 500)
    return () => {
      clearTimeout(timeoutId)
      observerRef.current?.disconnect()
    }
  }, [toc])

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setIsDrawerOpen(false)
  }, [])

  if (!toc || toc.length === 0) return null

  const tocItems = (
    <ul className="monograph-toc-list">
      {toc.map((item, index) => {
        const id = item.url.replace('#', '')
        const isActive = activeId === id
        return (
          <li
            key={`toc-${index}-${id}`}
            className={`monograph-toc-item ${isActive ? 'active' : ''}`}
          >
            <button
              className="monograph-toc-btn"
              onClick={() => scrollToHeading(id)}
            >
              {item.value}
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* Desktop: sidenote TOC (visible >= 1280px via CSS) */}
      <nav className="monograph-toc" aria-label="Table of contents">
        <div className="monograph-toc-label">目 录</div>
        {tocItems}
      </nav>

      {/* Mobile/Tablet: floating FAB */}
      <button
        className="monograph-toc-fab"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Open table of contents"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile/Tablet: drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="monograph-toc-drawer-backdrop"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="monograph-toc-drawer">
            <div className="monograph-toc-drawer-header">
              <span className="monograph-toc-drawer-title">目 录</span>
              <button
                className="monograph-toc-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close table of contents"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="monograph-toc-drawer-content">
              {tocItems}
            </div>
          </div>
        </>
      )}
    </>
  )
}
