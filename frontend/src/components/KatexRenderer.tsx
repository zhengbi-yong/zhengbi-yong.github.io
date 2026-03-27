'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface KatexRendererProps {
  math: string
  display?: boolean
}

export function KatexRenderer({ math, display = false }: KatexRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      try {
        // 解码 HTML 实体
        const decodedMath = math
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&#x27;/g, "'")

        katex.render(decodedMath, containerRef.current, {
          displayMode: display,
          throwOnError: false,
        })
      } catch (error) {
        console.error('KaTeX render error:', error)
        console.error('Math formula:', math)
        containerRef.current.innerHTML = `<code class="text-red-500">${math}</code>`
      }
    }
  }, [math, display])

  return <span ref={containerRef} />
}
