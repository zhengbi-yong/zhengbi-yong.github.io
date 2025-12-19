'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface BackToShelfButtonProps {
  className?: string
}

export default function BackToShelfButton({ className = '' }: BackToShelfButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/blog')
  }

  // 键盘快捷键：ESC 键返回
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <motion.button
      onClick={handleBack}
      className={`group flex items-center gap-2 rounded-lg border border-gray-200/50 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <svg
        className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span>返回书架</span>
    </motion.button>
  )
}
