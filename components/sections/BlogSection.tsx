'use client'

import { motion } from 'framer-motion'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import { Button } from '@/components/components/ui/button'

interface BlogSectionProps {
  title: string
  description?: string
  posts: CoreContent<Blog>[]
  showViewAllButton?: boolean
  limit?: number
}

/**
 * BlogSection - 博客部分组件
 * 参考 Astro 项目的 BlogSection 组件
 */
export default function BlogSection({
  title,
  description,
  posts,
  showViewAllButton = false,
  limit = 3,
}: BlogSectionProps) {
  const displayedPosts = posts.slice(0, limit)

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayedPosts.map((post, index) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:border-primary-500/50"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                {post.title}
              </h3>
              {post.summary && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-3">
                  {post.summary}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {post.readingTime && (
                  <span>{Math.ceil(post.readingTime.minutes)} 分钟阅读</span>
                )}
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
      {showViewAllButton && (
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/blog">查看所有文章</Link>
          </Button>
        </div>
      )}
    </motion.section>
  )
}

