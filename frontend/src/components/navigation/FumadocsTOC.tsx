'use client'

import { useRef } from 'react'
import { List } from 'lucide-react'
import { AnchorProvider, ScrollProvider, TOCItem } from 'fumadocs-core/toc'
import { cn } from '@/components/lib/utils'
import type { TOC } from '@/lib/types/toc'

interface FumadocsTOCProps {
  toc: TOC
}

/**
 * Fumadocs 风格的博客文章 TOC
 *
 * 直接使用 fumadocs-core 的 AnchorProvider + TOCItem：
 * - sticky 定位在右侧 sidebar
 * - 嵌套缩进 / data-[active=true] 高亮 / 点击跳转
 * - 左侧 border 线 + fumadocs 官方样式
 *
 * TOC 数据来自 MDX 编译管线的 remarkHeading（与 heading ID 同源）。
 * 父组件在 onCompiled 回调中传入 TOC，此时内容已在 DOM 中，
 * AnchorProvider 的 IntersectionObserver 可直接追踪 heading 元素。
 */
export function FumadocsTOC({ toc }: FumadocsTOCProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (!toc || toc.length === 0) {
    return null
  }

  return (
    <ScrollProvider containerRef={containerRef}>
      <AnchorProvider toc={toc}>
        <div
          className="sticky top-24 flex flex-col gap-2 pt-8"
          ref={containerRef}
        >
          {/* TOC 标题 */}
          <div className="flex items-center gap-2 mb-2">
            <List size={14} className="text-fd-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-fd-muted-foreground">
              目录
            </span>
          </div>

          {/* TOC 条目 — fumadocs 官方样式 */}
          <nav className="flex flex-col border-s border-fd-foreground/10">
            {toc.map((item) => (
              <TOCItem
                key={item.url}
                href={item.url}
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
              </TOCItem>
            ))}
          </nav>
        </div>
      </AnchorProvider>
    </ScrollProvider>
  )
}

FumadocsTOC.displayName = 'FumadocsTOC'
