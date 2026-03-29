'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const pathname = usePathname()

  // Only show on article pages
  const isArticlePage = pathname.startsWith('/blog/') && pathname !== '/blog'

  useEffect(() => {
    if (!isArticlePage) return undefined

    let ticking = false

    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrollTop = window.scrollY
      const newProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress(Math.min(100, Math.max(0, newProgress)))
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateProgress() // initial

    return () => window.removeEventListener('scroll', onScroll)
  }, [isArticlePage])

  const handleMouseEnter = useCallback(() => {
    if (progress > 0) setShowTooltip(true)
  }, [progress])

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false)
  }, [])

  if (!isArticlePage) return null

  const roundedProgress = Math.round(progress)

  return (
    <div className="fixed top-0 left-0 z-50 w-full">
      {/* Main progress bar */}
      <motion.div
        className="h-[3px] origin-left"
        style={{
          background: 'linear-gradient(90deg, hsl(250, 70%, 60%), hsl(280, 70%, 60%), hsl(300, 60%, 55%))',
        }}
        initial={{ scaleX: 0 }}
        animate={{
          scaleX: progress / 100,
          opacity: progress > 0 ? 1 : 0,
        }}
        transition={{
          scaleX: { duration: 0.1, ease: 'easeOut' },
          opacity: { duration: 0.2 },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="progressbar"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />

      {/* Glow effect trailing edge */}
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-0 h-[3px] w-16"
          style={{
            left: `${progress}%`,
            background: 'linear-gradient(90deg, transparent, hsl(280, 80%, 65%, 0.4), transparent)',
            filter: 'blur(4px)',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 rounded-md bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-md"
            style={{ left: `${Math.min(Math.max(progress, 5), 90)}%`, transform: 'translateX(-50%)' }}
          >
            {roundedProgress}%
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
