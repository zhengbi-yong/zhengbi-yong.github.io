'use client'

import { useEffect, useRef, useState } from 'react'

// Trap focus within a container
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return undefined

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )

    if (focusableElements.length === 0) return undefined

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
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

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}

// Restore focus to previous element
export function useFocusRestore(isOpen: boolean) {
  const previousElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousElementRef.current = document.activeElement as HTMLElement
    } else if (previousElementRef.current) {
      previousElementRef.current.focus()
    }
  }, [isOpen])
}

// Skip links manager
export function useSkipLinks() {
  useEffect(() => {
    // Add id to main content if not present
    const main = document.querySelector('main') || document.getElementById('main-content')
    if (main && !main.id) {
      main.id = 'main-content'
    }
  }, [])
}

// Detect focus visible
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  useEffect(() => {
    let hadKeyboardEvent = false

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        hadKeyboardEvent = true
      }
    }

    const onmousedown = () => {
      hadKeyboardEvent = false
    }

    const onFocus = () => {
      setIsFocusVisible(hadKeyboardEvent)
    }

    const onBlur = () => {
      setIsFocusVisible(false)
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onmousedown, true)
    document.addEventListener('focus', onFocus, true)
    document.addEventListener('blur', onBlur, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onmousedown, true)
      document.removeEventListener('focus', onFocus, true)
      document.removeEventListener('blur', onBlur, true)
    }
  }, [])

  return isFocusVisible
}

// Focus management utilities
export const focusUtils = {
  // Focus first element in container
  focusFirst: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )
    const firstElement = focusableElements[0] as HTMLElement
    firstElement?.focus()
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase()
    const focusableTags = ['a', 'button', 'input', 'textarea', 'select', 'details']

    if (focusableTags.includes(tagName)) {
      if (tagName === 'a') {
        return (element as HTMLAnchorElement).href !== ''
      }
      if (tagName === 'input') {
        const inputType = (element as HTMLInputElement).type
        const inputTypes = ['hidden', 'file']
        return !inputTypes.includes(inputType)
      }
      return !(element as HTMLButtonElement).disabled && !(element as HTMLInputElement).disabled
    }

    // Check for tabindex
    const tabindex = element.getAttribute('tabindex')
    if (tabindex !== null) {
      const num = parseInt(tabindex, 10)
      return !isNaN(num) && num >= 0
    }

    // Check contenteditable
    if (element.getAttribute('contenteditable') === 'true') {
      return true
    }

    return false
  },

  // Get all focusable elements in container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]'
      )
    )

    return elements.filter((el) => {
      // Skip hidden elements
      if (el.offsetParent === null) return false

      // Skip disabled elements
      if (el.hasAttribute('disabled')) return false

      // Skip elements with tabindex < 0
      const tabindex = el.getAttribute('tabindex')
      if (tabindex !== null && parseInt(tabindex, 10) < 0) return false

      return true
    })
  },
}

// Add custom focus styles
export function initFocusStyles() {
  if (typeof document === 'undefined') return

  const styleId = 'focus-visible-styles'

  // Check if styles already exist
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    .js-focus-visible :focus:not([data-focus-visible-added]) {
      outline: none;
    }

    .js-focus-visible [data-focus-visible-added] {
      outline: 2px solid var(--primary, #2563eb);
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .js-focus-visible [data-focus-visible-added] {
        outline-width: 3px;
      }
    }

    /* Skip links */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--primary, #2563eb);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 100;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 6px;
    }
  `

  document.head.appendChild(style)

  // Add class to html element
  document.documentElement.classList.add('js-focus-visible')
}

// Initialize focus styles
if (typeof window !== 'undefined') {
  initFocusStyles()
}
