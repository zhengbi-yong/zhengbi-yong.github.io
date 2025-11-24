'use client'

import { Children, isValidElement, cloneElement } from 'react'
import AnimatedSection from './AnimatedSection'

interface AnimatedListProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

/**
 * AnimatedList - 交错动画列表组件
 * 为子元素提供交错动画效果，每个子元素依次触发动画
 */
export default function AnimatedList({
  children,
  staggerDelay = 100,
  className = '',
}: AnimatedListProps) {
  // 将 children 转换为数组
  const childrenArray = Children.toArray(children)

  // 如果只有一个子元素或没有子元素，直接渲染
  if (childrenArray.length <= 1) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        // 检查是否为有效的 React 元素
        if (isValidElement(child)) {
          return (
            <AnimatedSection key={child.key || index} delay={index * staggerDelay}>
              {child}
            </AnimatedSection>
          )
        }
        // 如果不是有效元素，直接渲染
        return (
          <AnimatedSection key={index} delay={index * staggerDelay}>
            {child}
          </AnimatedSection>
        )
      })}
    </div>
  )
}
