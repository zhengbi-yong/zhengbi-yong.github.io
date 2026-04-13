'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function SkipLink() {
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocused(true)
      }
    }

    const handleMouseDown = () => {
      setIsFocused(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const handleSkipLink = (e: React.MouseEvent) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return (
    <a
      href="#main-content"
      onClick={handleSkipLink}
      className={cn(
        'bg-primary-600 focus:ring-primary-400 absolute top-0 left-0 z-[9999] -translate-y-full rounded-b-lg px-4 py-2 text-white transition-transform duration-200 focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none',
        !isFocused && 'sr-only'
      )}
    >
      跳转到主内容
    </a>
  )
}
