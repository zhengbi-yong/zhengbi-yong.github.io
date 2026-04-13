'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { usePosts } from '@/lib/hooks/useBlogData'
import { toBlogLikePost } from '@/lib/adapters/backend-posts'
import { cn } from '@/lib/utils'

export default function LatestWriting() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { data: postsData } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: 3,
    page: 1,
  })

  const posts = useMemo(() => {
    return (postsData?.posts || []).map(toBlogLikePost)
  }, [postsData?.posts])

  const themeClasses = isDark
    ? {
        muted: 'text-gray-500',
        text: 'text-gray-100',
        accent: 'text-indigo-300',
        featuredCard: 'border-white/[0.06] hover:border-indigo-400/20 bg-gradient-to-br from-indigo-950/30 to-transparent',
      }
    : {
        muted: 'text-gray-400',
        text: 'text-gray-800',
        accent: 'text-indigo-600',
        featuredCard: 'border-black/[0.06] hover:border-indigo-400/20 bg-gradient-to-br from-indigo-50/50 to-transparent',
      }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6" aria-label="Latest Writing">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={cn('mb-2 block text-xs tracking-[0.3em] uppercase', themeClasses.muted)}>
            Writing
          </span>
          <h2 className={cn('font-visitor-serif text-3xl sm:text-4xl', themeClasses.text)}>
            Latest Thoughts
          </h2>
        </motion.div>

        {/* Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured Article - 60% */}
          {featured && (
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Link href={`/${featured.path}`} className="group block">
                <div
                  className={cn(
                    'min-h-[300px] rounded-3xl border bg-gradient-to-br p-8 transition-all duration-500 sm:p-10',
                    'flex flex-col justify-end',
                    themeClasses.featuredCard
                  )}
                >
                  <span className={cn('mb-4 block text-xs tracking-[0.2em] uppercase', themeClasses.accent)}>
                    Featured
                  </span>
                  <h3 className={cn('mb-3 font-visitor-serif text-2xl leading-tight sm:text-3xl', themeClasses.text)}>
                    {featured.title}
                  </h3>
                  {featured.summary && (
                    <p className={cn('mb-4 line-clamp-3 text-sm sm:text-base', themeClasses.muted)}>
                      {featured.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs', themeClasses.muted)}>
                      {featured.date ? new Date(featured.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : ''}
                    </span>
                    {featured.tags[0] && (
                      <>
                        <span className={themeClasses.muted}>·</span>
                        <span className={cn('text-xs', themeClasses.accent)}>{featured.tags[0]}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* List Articles - 40% */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {rest.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1, duration: 0.7 }}
              >
                <Link
                  href={`/${post.path}`}
                  className="group flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:translate-x-2"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className={cn('mb-1 font-visitor-serif text-base transition-transform duration-300 group-hover:translate-x-1 line-clamp-2 sm:text-lg', themeClasses.text)}>
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs', themeClasses.muted)}>
                        {post.date ? new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : ''}
                      </span>
                      {post.tags[0] && (
                        <>
                          <span className={themeClasses.muted}>·</span>
                          <span className={cn('text-xs', themeClasses.accent)}>{post.tags[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-lg transition-all duration-300 group-hover:translate-x-1', themeClasses.muted)}>
                    →
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* Empty state */}
            {posts.length === 0 && (
              <div className={cn('py-12 text-center', themeClasses.muted)}>
                <p className="text-sm">No articles yet</p>
              </div>
            )}
          </div>
        </div>

        {/* View All */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/blog"
            className={cn('group inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase transition-all duration-300', themeClasses.accent)}
          >
            View All Articles
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
