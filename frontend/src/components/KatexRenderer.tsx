'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface KatexRendererProps {
  math: string
  display?: boolean | string
}

export function KatexRenderer({ math, display = false }: KatexRendererProps) {
  // Normalize display prop: accept string ("true"/"false") or boolean
  const isDisplay = display === true || display === 'true'
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    try {
      // 解码 HTML 实体
      const decodedMath = math
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")

      katex.render(decodedMath, container, {
        displayMode: isDisplay,
        throwOnError: false,
      })
    } catch (error) {
      console.error('KaTeX render error:', error)
      console.error('Math formula:', math)
      // XSS 防御：转义 math 内容后再插入 innerHTML
      const raw = math ?? ''
      const escaped = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      container.innerHTML = `<code class="text-red-500">${escaped}</code>`
    }

    // Cleanup: prevent stale DOM updates and clear on unmount
    return () => {
      if (container) {
        container.textContent = ''
      }
    }
  }, [math, isDisplay])

  return isDisplay ? <span ref={containerRef} className="block text-center" /> : <span ref={containerRef} />
}
