import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import ShaderBackgroundWrapper from '@/components/ShaderBackgroundWrapper'
import Button from '@/components/ui/Button'
import AnimatedText from '@/components/home/AnimatedText'
import HeroCard from '@/components/home/HeroCard'
import SocialCard from '@/components/home/SocialCard'
import Explore from '@/components/sections/Explore'
import FeaturedWork from '@/components/sections/FeaturedWork'
import BlogSection from '@/components/sections/BlogSection'
import siteMetadata from '@/data/siteMetadata'

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default function Home({ posts }: HomeProps) {
  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundWrapper intensity={0.8} />
      </div>
      {/* 主页内容 */}
      <div className="relative z-10 w-full mx-auto mt-16 px-4 md:mt-18 lg:mt-20 xl:px-0">
        {/* 内容背景遮罩 - 提升文字可读性 */}
        <div className="fixed inset-0 -z-[5] bg-white/20 dark:bg-gray-950/60 backdrop-blur-sm" />
        {/* Hero 区域 */}
        <div className="relative w-full px-4 flex flex-col items-center justify-between md:flex-row mb-16">
          {/* 左侧：标题和描述 */}
          <div className="relative w-full md:max-w-[420px] md:w-1/2 text-center sm:text-left sm:-mt-8">
            {/* Title - AnimatedText animation */}
            <h1 className="mb-4">
              <AnimatedText
                content="Hi, I'm Zhengbi Yong"
                delay={0.1}
                duration={0.5}
                stagger={0.08}
                className="text-5xl text-primary leading-tight md:text-4xl lg:text-6xl font-bold"
              />
            </h1>
            {/* First description - AnimatedText animation */}
            <div className="mb-2">
              <AnimatedText
                content="I'm a robotics engineer and UI designer with 8+ years of experience. I love blending design and code to create captivating visuals and interactive experiences."
                delay={0.3}
                duration={0.5}
                stagger={0.015}
                className="text-base text-neutral-700 dark:text-neutral-300"
              />
            </div>
            {/* Second description - AnimatedText animation */}
            <div className="mb-4">
              <AnimatedText
                content="I believe great design should be both delightful and solve real-world challenges."
                delay={0.5}
                duration={0.5}
                stagger={0.015}
                className="text-base text-neutral-700 dark:text-neutral-300"
              />
            </div>
            {/* Button */}
            <div className="mt-4 sm:mt-6">
              <Button
                url={siteMetadata.x || siteMetadata.github || '#'}
                type="fill"
                size="md"
                className="m-auto sm:m-0"
              >
                Follow me on 𝕏
              </Button>
            </div>
            {/* Social Cards */}
            <div className="mt-8 mb-8">
              <SocialCard displaySocialIds={[1, 2, 3, 4]} />
            </div>
          </div>
          {/* 右侧：HeroCard */}
          <div className="relative justify-end w-full mt-16 md:flex md:pl-10 md:w-1/2 md:mt-0 md:translate-y-4 xl:translate-y-0">
            <HeroCard
              imageUrl="/static/images/robotics/SO-100.webp"
              title="Robotics Projects"
              link="/blog"
            />
          </div>
        </div>

        {/* Explore 部分 */}
        <section className="mt-26 mb-12">
          <Explore title="Explore ↓" />
        </section>

        {/* Featured Work 部分 */}
        <section className="mt-26 mb-12">
          <FeaturedWork
            title="Featured Work ↓"
            description="I create innovative and purposeful designs that not only capture attention but also drive meaningful results."
            limit={5}
          />
        </section>

        {/* Blog Section 部分 */}
        <section className="mt-26 mb-12">
          <BlogSection
            title="Latest Articles ↓"
            description="These are my notes and articles on design, development and life thinking."
            posts={posts}
            showViewAllButton={true}
            limit={3}
          />
        </section>
      </div>
    </div>
  )
}
