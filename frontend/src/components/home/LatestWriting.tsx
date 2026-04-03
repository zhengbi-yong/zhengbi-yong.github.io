'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { usePosts } from '@/lib/hooks/useBlogData'
import { toBlogLikePost } from '@/lib/adapters/backend-posts'

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

  const mutedColor = isDark ? 'text-gray-500' : 'text-gray-400'
  const textColor = isDark ? 'text-gray-100' : 'text-gray-800'
  const accentColor = isDark ? 'text-indigo-300' : 'text-indigo-600'

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
          <span className={`text-xs tracking-[0.3em] uppercase ${mutedColor} block mb-2`}>
            Writing
          </span>
          <h2 className={`font-visitor-serif text-3xl sm:text-4xl ${textColor}`}>
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
                  className={`
                    rounded-3xl p-8 sm:p-10 min-h-[300px] flex flex-col justify-end
                    border transition-all duration-500
                    ${isDark
                      ? 'border-white/[0.06] hover:border-indigo-400/20 bg-gradient-to-br from-indigo-950/30 to-transparent'
                      : 'border-black/[0.06] hover:border-indigo-400/20 bg-gradient-to-br from-indigo-50/50 to-transparent'
                    }
                  `}
                >
                  <span className={`text-xs tracking-[0.2em] uppercase ${accentColor} block mb-4`}>
                    Featured
                  </span>
                  <h3 className={`font-visitor-serif text-2xl sm:text-3xl ${textColor} mb-3 leading-tight`}>
                    {featured.title}
                  </h3>
                  {featured.summary && (
                    <p className={`text-sm sm:text-base ${mutedColor} line-clamp-3 mb-4`}>
                      {featured.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${mutedColor}`}>
                      {featured.date ? new Date(featured.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : ''}
                    </span>
                    {featured.tags[0] && (
                      <>
                        <span className={mutedColor}>·</span>
                        <span className={`text-xs ${accentColor}`}>{featured.tags[0]}</span>
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
                    <h4 className={`font-visitor-serif text-base sm:text-lg ${textColor} mb-1 line-clamp-2 group-hover:translate-x-1 transition-transform duration-300`}>
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${mutedColor}`}>
                        {post.date ? new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : ''}
                      </span>
                      {post.tags[0] && (
                        <>
                          <span className={mutedColor}>·</span>
                          <span className={`text-xs ${accentColor}`}>{post.tags[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-lg transition-all duration-300 group-hover:translate-x-1 ${mutedColor}`}>
                    →
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* Empty state */}
            {posts.length === 0 && (
              <div className={`text-center py-12 ${mutedColor}`}>
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
            className={`group inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase ${accentColor} transition-all duration-300`}
          >
            View All Articles
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
