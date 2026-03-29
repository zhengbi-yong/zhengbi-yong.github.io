'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { BackendComments } from '@/components/post/BackendComments'

interface CommentDrawerProps {
  slug: string
  commentCount?: number
}

/**
 * CommentDrawer - Slide-in drawer for post comments with FAB trigger
 *
 * Features:
 * - Floating Action Button (FAB) with comment count badge
 * - Slide-in drawer from the right with backdrop
 * - Smooth spring animations via Framer Motion
 * - Accessible keyboard navigation
 */
export function CommentDrawer({ slug, commentCount = 0 }: CommentDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* FAB - Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2',
          'rounded-full px-4 py-3 shadow-lg',
          'bg-primary text-primary-foreground',
          'hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-shadow duration-200'
        )}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
        aria-label="Open comments"
      >
        <MessageCircle size={20} />
        {commentCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground"
          >
            {commentCount}
          </motion.span>
        )}
      </motion.button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'fixed right-0 top-0 bottom-0 z-50',
                'w-full max-w-md',
                'bg-background border-l border-border',
                'shadow-2xl',
                'flex flex-col',
                'overflow-hidden'
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Comments"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Comments
                  </h2>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'rounded-full p-2',
                    'text-muted-foreground hover:text-foreground',
                    'hover:bg-muted',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close comments"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <BackendComments slug={slug} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default CommentDrawer
