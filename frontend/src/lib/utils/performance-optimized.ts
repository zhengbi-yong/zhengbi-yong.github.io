/**
 * 性能优化工具函数
 * 用于优化动画性能和减少卡顿
 */

/**
 * 防抖函数 - 限制函数执行频率
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 检测设备性能等级
 */
export function getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium'

  // 检查内存信息（如果可用）
  const memory = (performance as any).memory
  if (memory && memory.totalJSHeapSize < 100 * 1024 * 1024) {
    // < 100MB
    return 'low'
  }

  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) return 'low'
  if (cores <= 4) return 'medium'
  return 'high'
}

/**
 * 获取性能优化的动画参数
 */
export function getOptimizedAnimationParams(
  baseDuration: number = 0.5,
  baseDelay: number = 0
): { duration: number; delay: number; useReducedMotion: boolean } {
  const performanceLevel = getDevicePerformanceLevel()

  // 根据设备性能调整动画参数
  const durationMultipliers = {
    low: 0.3, // 低性能设备大幅减少动画时长
    medium: 0.7, // 中等性能设备适当减少
    high: 1, // 高性能设备保持原始时长
  }

  const delayMultipliers = {
    low: 0, // 低性能设备不使用延迟
    medium: 0.5, // 中等性能设备减少延迟
    high: 1, // 高性能设备保持原始延迟
  }

  return {
    duration: baseDuration * durationMultipliers[performanceLevel],
    delay: baseDelay * delayMultipliers[performanceLevel],
    useReducedMotion: performanceLevel === 'low',
  }
}

/**
 * 检测是否应该禁用复杂动画
 */
export function shouldDisableComplexAnimations(): boolean {
  const performanceLevel = getDevicePerformanceLevel()
  return performanceLevel === 'low'
}

/**
 * 批量 DOM 操作函数
 */
export function batchDOMUpdates(operations: (() => void)[]): void {
  // 使用 requestAnimationFrame 批量执行 DOM 操作
  requestAnimationFrame(() => {
    operations.forEach((operation) => operation())
  })
}

/**
 * 预加载资源函数
 */
export function preloadResource(href: string, as: string = 'script'): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    link.onload = () => resolve()
    link.onerror = reject
    document.head.appendChild(link)
  })
}
