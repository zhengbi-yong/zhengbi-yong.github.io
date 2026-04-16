import { memo, useCallback } from 'react'
import { cn } from '@/components/lib/utils'
import styles from './TOC.module.css'
import type { HeadingNode } from './types'

interface TOCItemProps {
  node: HeadingNode
  activeHeadingId: string | null
  onLinkClick: (slug: string, e: React.MouseEvent<HTMLAnchorElement>) => void
  getDepthClass: (depth: number) => string
}

/**
 * TOC 目录项组件
 * 递归渲染目录树中的单个节点及其子节点
 */
export const TOCItem = memo(function TOCItem({
  node,
  activeHeadingId,
  onLinkClick,
  getDepthClass,
}: TOCItemProps) {
  const nodeId = node.url.replace('#', '')
  const isActive = activeHeadingId === nodeId

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onLinkClick(node.url, e)
    },
    [node.url, onLinkClick]
  )

  return (
    <li className={cn(styles.tocItem, 'font-brand', getDepthClass(node.depth))}>
      <a
        href={node.url}
        data-depth={node.depth}
        data-id={nodeId}
        aria-current={isActive ? 'location' : undefined}
        className={cn(
          'toc-link',
          isActive && 'active',
          !isActive && 'dark:hover:text-primary-400 dark:text-gray-400 dark:hover:bg-gray-800'
        )}
        style={
          isActive
            ? ({
                color: 'var(--toc-active-text)',
                backgroundColor: 'var(--toc-active-bg)',
                fontWeight: 600,
                boxShadow: 'var(--toc-shadow)',
              } as React.CSSProperties)
            : undefined
        }
        onClick={handleClick}
      >
        {isActive && (
          <span
            style={
              {
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '70%',
                background: 'var(--toc-active-indicator)',
                borderRadius: '0 2px 2px 0',
                boxShadow: 'var(--toc-indicator-shadow)',
              } as React.CSSProperties
            }
          />
        )}
        {node.value}
      </a>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child, idx) => (
            <TOCItem
              key={`${child.url}-child-${idx}`}
              node={child}
              activeHeadingId={activeHeadingId}
              onLinkClick={onLinkClick}
              getDepthClass={getDepthClass}
            />
          ))}
        </ul>
      )}
    </li>
  )
})
