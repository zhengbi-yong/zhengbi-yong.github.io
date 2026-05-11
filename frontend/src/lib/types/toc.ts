/**
 * TOC (Table of Contents) 类型定义
 * Aligned with fumadocs-core TOCItemType for native AnchorProvider compatibility.
 */

import type { ReactNode } from 'react'

export interface TOCItem {
  /** 标题文本（支持 ReactNode — fumadocs 可含 inline code、bold 等） */
  title: ReactNode
  /** 锚点链接（如 #heading-1） */
  url: string
  /** 标题层级（1-6） */
  depth: number
}

export type TOC = TOCItem[]
