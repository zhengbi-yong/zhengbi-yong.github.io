/**
 * TOC (Table of Contents) 类型定义
 * 匹配 pliny/mdx-plugins 中 extractTocHeadings 返回的数据结构
 */

export interface TOCItem {
  value: string // 标题文本
  url: string // 锚点链接（如 #heading-1）
  depth: number // 标题层级（1-6）
}

export type TOC = TOCItem[]
