import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from 'next/link'
import HeroCard from '@/components/home/HeroCard'
import SocialCard from '@/components/home/SocialCard'
import Explore from '@/components/sections/Explore'
import FeaturedWork from '@/components/sections/FeaturedWork'
import BlogSection from '@/components/sections/BlogSection'
import NewsletterSignup from '@/components/NewsletterSignup'
import siteMetadata from '@/data/siteMetadata'
import { AnimatedHeading, AnimatedParagraph } from '@/components/visitor'

// 导入游客界面主题样式
import '@/styles/visitor-theme.css'

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default function Home({ posts }: HomeProps) {
  return (
    <div className="relative min-h-screen">
      {/* 主页内容 - 艺术感和宽松布局 */}
      <div className="visitor-content">
        {/* Hero 区域 - 极简主义设计 */}
        <section className="min-h-[80vh] flex flex-col justify-center py-visitor-xl">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title - 衬线字体，优雅动画 */}
            <AnimatedHeading level={1} delay={0} className="font-visitor-serif text-6xl md:text-7xl lg:text-8xl mb-8">
              Zhengbi's Blog
            </AnimatedHeading>

            {/* Subtitle - 优雅的副标题 */}
            <AnimatedParagraph delay={0.3} className="text-visitor-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              探索技术、设计与艺术的交汇点
            </AnimatedParagraph>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

        {/* Social Cards - 优雅的社交链接展示 */}
        <section className="py-visitor-md">
          <div className="max-w-md mx-auto">
            <SocialCard displaySocialIds={[1, 2, 3, 4, 5, 6, 7]} />
          </div>
        </section>

        {/* Hero Card - 精致的卡片展示 */}
        <section className="py-visitor-lg">
          <div className="max-w-2xl mx-auto">
            <HeroCard
              imageUrl="/avatar.png"
              title="Robotics & Multimodal Perception"
              link="/blog"
            />
          </div>
        </section>

        {/* Explore 部分 */}
        <section className="visitor-section">
          <Explore title="Explore" />
        </section>

        {/* Featured Work 部分 */}
        <section className="visitor-section">
          <FeaturedWork
            title="Featured Work"
            description="I create innovative and purposeful designs that not only capture attention but also drive meaningful results."
            limit={5}
          />
        </section>

        {/* Blog Section 部分 */}
        <section className="visitor-section">
          <BlogSection
            title="Latest Articles"
            description="These are my notes and articles on design, development and life thinking."
            posts={posts}
            showViewAllButton={true}
            limit={3}
          />
        </section>

        {/* Newsletter 部分 - 优雅的订阅区域 */}
        <section className="visitor-section pb-visitor-xl">
          <div className="max-w-2xl mx-auto">
            <NewsletterSignup />
          </div>
        </section>
      </div>
    </div>
  )
}
