'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import Spinner from './Spinner'
import { cn } from '@/components/lib/utils'

interface ComponentLoaderProps {
  isLoading: boolean
  children: ReactNode
  skeleton?: ReactNode
  spinner?: boolean
  message?: string
  className?: string
}

/**
 * ComponentLoader - 组件加载包装器
 * 根据加载状态显示加载动画或内容
 */
export default function ComponentLoader({
  isLoading,
  children,
  skeleton,
  spinner = true,
  message,
  className,
}: ComponentLoaderProps) {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 py-8"
          >
            {skeleton ? (
              skeleton
            ) : (
              <>
                {spinner && <Spinner size="lg" />}
                {message && <p className="text-gray-600 dark:text-gray-400">{message}</p>}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
