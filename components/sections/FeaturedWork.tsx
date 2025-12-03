'use client'

import { motion } from 'framer-motion'
import projectsData from '@/data/projectsData'
import Card from '@/components/Card'

interface FeaturedWorkProps {
  title: string
  description?: string
  limit?: number
}

/**
 * FeaturedWork - 精选作品部分组件
 * 参考 Astro 项目的 FeaturedWork 组件
 */
export default function FeaturedWork({
  title,
  description,
  limit = 5,
}: FeaturedWorkProps) {
  const featuredProjects = projectsData.slice(0, limit)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="space-y-8"
    >
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        {featuredProjects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <Card
              title={project.title}
              description={project.description}
              imgSrc={project.imgSrc}
              href={project.href}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

