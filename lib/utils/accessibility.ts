/**
 * 可访问性工具函数
 * 提供可访问性相关的检测和管理功能
 */

/**
 * 检查是否支持高对比度模式
 * @returns 是否偏好高对比度
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-contrast: high)').matches ?? false
}

/**
 * 检查是否偏好减少动画
 * @returns 是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * 管理焦点陷阱
 * 将焦点限制在指定元素内，用于模态框等场景
 * @param element 要限制焦点的元素
 * @returns 清理函数，用于移除焦点陷阱
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleTab)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleTab)
  }
}
