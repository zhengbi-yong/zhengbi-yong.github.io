'use client'

import { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface AnimationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface AnimationErrorBoundaryState {
  hasError: boolean
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
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): AnimationErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Animation component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="opacity-50">动画加载失败</div>
    }
    return this.props.children
  }
}

