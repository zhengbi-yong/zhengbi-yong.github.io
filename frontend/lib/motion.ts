'use client'

import { useEffect, useState } from 'react'

// Check if user prefers reduced motion
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for saved preference or system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const savedPreference = localStorage.getItem('prefers-reduced-motion')

    const updateMotionPreference = () => {
      const systemPrefersReduced = mediaQuery.matches
      const effectivePreference =
        savedPreference !== null ? savedPreference === 'true' : systemPrefersReduced

      setPrefersReduced(effectivePreference)

      // Apply to document
      if (effectivePreference) {
        document.documentElement.setAttribute('data-reduced-motion', 'true')
        document.documentElement.style.setProperty('--duration-fast', '0ms')
        document.documentElement.style.setProperty('--duration-normal', '0ms')
        document.documentElement.style.setProperty('--duration-slow', '0ms')
      } else {
        document.documentElement.removeAttribute('data-reduced-motion')
        document.documentElement.style.removeProperty('--duration-fast')
        document.documentElement.style.removeProperty('--duration-normal')
        document.documentElement.style.removeProperty('--duration-slow')
      }
    }

    updateMotionPreference()

    // Listen for changes
    const handleChange = () => updateMotionPreference()
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReduced
}

// Set reduced motion preference
export function setReducedMotion(enabled: boolean) {
  localStorage.setItem('prefers-reduced-motion', enabled.toString())

  // Trigger a custom event for components to listen to
  window.dispatchEvent(
    new CustomEvent('motionPreferenceChange', {
      detail: { reduced: enabled },
    })
  )
}

// Motion-aware animation hook
export function useMotionAwareAnimation(
  normalAnimation: string,
  reducedAnimation: string = 'none'
) {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? reducedAnimation : normalAnimation
}

// CSS variables for motion
export const motionVariables = {
  // Default durations
  '--duration-instant': '0ms',
  '--duration-fast': '120ms',
  '--duration-normal': '200ms',
  '--duration-slow': '300ms',
  '--duration-slower': '500ms',

  // Easing functions
  '--ease-linear': 'linear',
  '--ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  '--ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  '--ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Advanced easing
  '--ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
  '--ease-out-circ': 'cubic-bezier(0.33, 0, 0.67, 1)',
  '--ease-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}

// Framer Motion variants with reduced motion support
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
}

// Reduced motion variants
export const reducedMotionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.01 },
  },

  slideUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.01 },
  },

  scaleIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.01 },
  },
}
