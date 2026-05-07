'use client'

import { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface AnimationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface AnimationErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * AnimationErrorBoundary - 动画组件错误边界
 * 捕获动画组件中的错误，提供降级显示
 */
export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  constructor(props: AnimationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): AnimationErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Animation component error:', error, errorInfo)
    this.setState({ error })
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive dark:border-destructive/15 dark:text-destructive">
            <strong>动画加载失败</strong>
            <details className="mt-1">
              <summary className="cursor-pointer">查看错误详情</summary>
              <pre className="mt-1 text-xs opacity-70">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
          </div>
        )
      )
    }
    return this.props.children
  }
}
