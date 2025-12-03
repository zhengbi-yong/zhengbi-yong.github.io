'use client'

import { motion } from 'framer-motion'

interface ExploreProps {
  title: string
}

/**
 * Explore - 探索部分组件
 * 参考 Astro 项目的 Explore 组件
 */
export default function Explore({ title }: ExploreProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-center"
    >
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
        {title}
      </h2>
    </motion.div>
  )
}

