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
 * 使用 fumadocs-core 的 AnchorProvider + TOCItem 实现：
 * - sticky 定位在右侧 sidebar
 * - 嵌套缩进显示标题层级
 * - active heading 自动高亮（fumadocs 原生 IntersectionObserver 机制）
 * - 点击平滑滚动到目标标题
 *
 * 与 fumadocs DocsPage 的 TOC 视觉风格一致：
 * - 左侧 border 线 + 缩进
 * - text-fd-muted-foreground / text-fd-primary 颜色系统
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
          {/* TOC 标题 — 与 fumadocs DocsPage TOC header 一致 */}
          <div className="flex items-center gap-2 mb-2">
            <List size={14} className="text-fd-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-fd-muted-foreground">
              目录
            </span>
          </div>

          {/* TOC 条目 — 完全复用 fumadocs 原生样式 */}
          <nav className="flex flex-col border-s border-fd-foreground/10">
            {toc.map((item) => (
              <TOCItem
                key={item.url}
                href={item.url}
                className={cn(
                  'prose py-1.5 text-sm text-fd-muted-foreground scroll-m-4 transition-colors wrap-anywhere',
                  'first:pt-0 last:pb-0',
                  'data-[active=true]:text-fd-primary',
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
