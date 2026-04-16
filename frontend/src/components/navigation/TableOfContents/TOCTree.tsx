import { memo, useCallback } from 'react'
import styles from './TOC.module.css'
import type { HeadingNode } from './types'
import { TOCItem } from './TOCItem'

interface TOCTreeProps {
  tree: HeadingNode[]
  activeHeadingId: string | null
  onLinkClick: (slug: string, e: React.MouseEvent<HTMLAnchorElement>) => void
}

/**
 * TOC 目录树组件
 * 渲染整个目录树结构
 */
export const TOCTree = memo(function TOCTree({
  tree,
  activeHeadingId,
  onLinkClick,
}: TOCTreeProps) {
  // 获取深度样式类
  const getDepthClass = useCallback((depth: number) => {
    switch (depth) {
      case 1:
        return styles.depth1
      case 2:
        return styles.depth2
      case 3:
        return styles.depth3
      default:
        return styles.depth3
    }
  }, [])

  return (
    <ul>
      {tree.map((node, index) => (
        <TOCItem
          key={`${node.url}-${index}`}
          node={node}
          activeHeadingId={activeHeadingId}
          onLinkClick={onLinkClick}
          getDepthClass={getDepthClass}
        />
      ))}
    </ul>
  )
})
