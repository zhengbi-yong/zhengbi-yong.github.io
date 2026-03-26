'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import HeroCard from '@/components/home/HeroCard'
import SocialCard from '@/components/home/SocialCard'
import Explore from '@/components/sections/Explore'
import FeaturedWork from '@/components/sections/FeaturedWork'
import BlogSection from '@/components/sections/BlogSection'
import NewsletterSignup from '@/components/NewsletterSignup'
import siteMetadata from '@/data/siteMetadata'
import { AnimatedHeading, AnimatedParagraph } from '@/components/visitor'
import { usePosts } from '@/lib/hooks/useBlogData'
import { toBlogLikePost } from '@/lib/adapters/backend-posts'

import '@/styles/visitor-theme.css'

export default function Home() {
  const { data: postsData } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: 6,
    page: 1,
  })

  const posts = useMemo(() => {
    return (postsData?.posts || []).map(toBlogLikePost)
  }, [postsData?.posts])

  return (
    <div className="relative min-h-screen">
      <div className="visitor-content px-4 sm:px-6 lg:px-8 2xl:px-10">
        <section className="min-h-[80vh] flex flex-col justify-center py-visitor-xl">
          <div className="mx-auto w-full max-w-7xl text-center">
            <AnimatedHeading
              level={1}
              delay={0}
              className="font-visitor-serif mb-8 text-5xl sm:text-6xl md:text-7xl xl:text-8xl"
            >
              Zhengbi's Blog
            </AnimatedHeading>

            <AnimatedParagraph
              delay={0.3}
              className="text-visitor-lg mx-auto mb-12 max-w-4xl text-gray-600 dark:text-gray-400"
            >
              探索技术、设计与艺术的交汇点
            </AnimatedParagraph>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={siteMetadata.github || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-visitor-md bg-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-visitor-soft transition-all duration-300 ease-visitor hover:bg-indigo-700 hover:shadow-visitor-glow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View GitHub
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-visitor-md bg-gray-100 px-8 py-4 text-lg font-medium text-gray-900 transition-all duration-300 ease-visitor hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Read Blog
              </Link>
            </div>
          </div>
        </section>

        <section className="py-visitor-md">
          <div className="mx-auto w-full max-w-2xl">
            <SocialCard displaySocialIds={[1, 2, 3, 4, 5, 6, 7]} />
          </div>
        </section>

        <section className="py-visitor-lg">
          <div className="mx-auto w-full max-w-6xl">
            <HeroCard
              imageUrl="/avatar.png"
              title="Robotics & Multimodal Perception"
              link="/blog"
            />
          </div>
        </section>

        <section className="visitor-section">
          <Explore title="Explore" />
        </section>

        <section className="visitor-section">
          <FeaturedWork
            title="Featured Work"
            description="I create innovative and purposeful designs that not only capture attention but also drive meaningful results."
            limit={5}
          />
        </section>

        <section className="visitor-section">
          <BlogSection
            title="Latest Articles"
            description="These are my notes and articles on design, development and life thinking."
            posts={posts}
            showViewAllButton={true}
            limit={3}
          />
        </section>

        <section className="visitor-section pb-visitor-xl">
          <div className="mx-auto w-full max-w-4xl">
            <NewsletterSignup />
          </div>
        </section>
      </div>
    </div>
  )
}
