'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import BentoCard from './BentoCard'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'
import { usePosts } from '@/lib/hooks/useBlogData'
import projectsData from '@/data/projectsData'
import musicData from '@/data/musicData'

export default function BentoGrid() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { data: postsData } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: 3,
    page: 1,
  })

  const posts = postsData?.posts || []

  const accentColor = isDark ? 'text-indigo-300' : 'text-indigo-600'
  const mutedColor = isDark ? 'text-gray-500' : 'text-gray-400'
  const textColor = isDark ? 'text-gray-200' : 'text-gray-800'

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6" aria-label="Content Hub">
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={`text-xs tracking-[0.3em] uppercase ${mutedColor}`}>
            Featured
          </span>
        </motion.div>

        {/* Bento Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]"
        >
          {/* Featured Post - Large card */}
          {posts[0] && (
            <BentoCard colSpan={2} rowSpan={2} className="group cursor-pointer">
              <Link href={`/blog/${posts[0].slug}`} className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <Image
                    src={posts[0].cover_image_url || DEFAULT_COVER_IMAGE}
                    alt={posts[0].title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="relative z-10">
                  <span className="text-xs tracking-[0.2em] uppercase text-indigo-300 mb-2 block">
                    Article
                  </span>
                  <h3 className="font-visitor-serif text-xl sm:text-2xl text-white mb-2 line-clamp-2">
                    {posts[0].title}
                  </h3>
                  {posts[0].summary && (
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {posts[0].summary}
                    </p>
                  )}
                </div>
              </Link>
            </BentoCard>
          )}

          {/* Recent Post 1 - Tall card */}
          {posts[1] && (
            <BentoCard rowSpan={2} className="group cursor-pointer">
              <Link href={`/blog/${posts[1].slug}`} className="h-full flex flex-col justify-between">
                <span className={`text-xs tracking-[0.2em] uppercase ${accentColor}`}>
                  Article
                </span>
                <div>
                  <h3 className={`font-visitor-serif text-lg ${textColor} mb-2 line-clamp-3 group-hover:translate-x-1 transition-transform duration-300`}>
                    {posts[1].title}
                  </h3>
                  <div className={`w-0 group-hover:w-12 h-0.5 ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'} transition-all duration-300`} />
                </div>
              </Link>
            </BentoCard>
          )}

          {/* Recent Post 2 - Tall card */}
          {posts[2] && (
            <BentoCard rowSpan={2} className="group cursor-pointer">
              <Link href={`/blog/${posts[2].slug}`} className="h-full flex flex-col justify-between">
                <span className={`text-xs tracking-[0.2em] uppercase ${accentColor}`}>
                  Article
                </span>
                <div>
                  <h3 className={`font-visitor-serif text-lg ${textColor} mb-2 line-clamp-3 group-hover:translate-x-1 transition-transform duration-300`}>
                    {posts[2].title}
                  </h3>
                  <div className={`w-0 group-hover:w-12 h-0.5 ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'} transition-all duration-300`} />
                </div>
              </Link>
            </BentoCard>
          )}

          {/* Featured Project - Wide card */}
          {projectsData[0] && (
            <BentoCard colSpan={2} hover3d className="group cursor-pointer">
              <Link href={projectsData[0].href || '#'} className="h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs tracking-[0.2em] uppercase text-amber-400">
                    Project
                  </span>
                  {projectsData[0].category && (
                    <span className={`text-xs ${mutedColor}`}>
                      / {projectsData[0].category}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className={`font-visitor-serif text-lg ${textColor} mb-1 line-clamp-2`}>
                    {projectsData[0].title}
                  </h3>
                  <p className={`text-sm ${mutedColor} line-clamp-2`}>
                    {projectsData[0].description}
                  </p>
                </div>
              </Link>
            </BentoCard>
          )}

          {/* Music Preview - Wide card */}
          {musicData[0] && (
            <BentoCard colSpan={2} className="group cursor-pointer">
              <Link href={`/music/${musicData[0].id}`} className="h-full flex flex-col justify-between relative">
                {/* Decorative staff lines */}
                <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-10 dark:opacity-10 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-px ${isDark ? 'bg-amber-300' : 'bg-amber-600'}`} />
                  ))}
                </div>
                <span className="text-xs tracking-[0.2em] uppercase text-purple-400 relative z-10">
                  Music
                </span>
                <div className="relative z-10">
                  <h3 className={`font-visitor-serif text-lg ${textColor} mb-1`}>
                    {musicData[0].title}
                  </h3>
                  <p className={`text-sm ${mutedColor}`}>
                    {musicData[0].composer || musicData[0].instrument}
                  </p>
                  {/* Musical note icon */}
                  <div className={`mt-2 text-2xl transition-transform duration-300 group-hover:scale-110 ${
                    isDark ? 'text-purple-400/60' : 'text-purple-500/60'
                  }`}>
                    ♪
                  </div>
                </div>
              </Link>
            </BentoCard>
          )}
        </div>
      </div>
    </section>
  )
}
