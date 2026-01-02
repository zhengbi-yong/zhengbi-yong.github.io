import type { TOC, TOCItem } from '@/lib/types/toc'

/**
 * 扩展的标题节点，包含子节点
 */
export interface HeadingNode extends TOCItem {
  children: HeadingNode[]
}

/**
 * 组件 Props
 */
export interface TableOfContentsProps {
  toc?: TOC
  enabled?: boolean
  mobileOnly?: boolean
}

/**
 * IntersectionObserver 监听的标题信息
 */
export interface HeadingInfo {
  id: string
  ratio: number
  top: number
  bottom: number
  element: HTMLElement
}

/**
 * 链接映射类型
 */
export type LinkMap = Map<string, HTMLAnchorElement>
