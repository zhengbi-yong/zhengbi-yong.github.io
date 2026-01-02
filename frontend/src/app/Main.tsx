import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { Button } from '@/components/shadcn/ui/button'
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
      {/* 主页内容 */}
      <div className="relative z-10 mx-auto mt-16 w-full px-4 md:mt-18 lg:mt-20 xl:px-8">
        {/* Hero 区域 */}
        <div className="relative mx-auto mb-16 flex w-full max-w-6xl flex-col items-center justify-between px-4 md:flex-row">
          {/* 左侧：标题和描述 */}
          <div className="relative w-full text-center sm:-mt-8 sm:text-left md:w-1/2 md:max-w-[400px]">
            {/* Title - AnimatedText animation */}
            <h1 className="mb-4">
              <AnimatedText
                content="Hi, I'm Zhengbi Yong"
                delay={0.1}
                duration={0.5}
                stagger={0.08}
                className="text-primary text-5xl leading-tight font-bold md:text-4xl lg:text-6xl"
              />
            </h1>
            {/* First description - AnimatedText animation */}
            <div className="mb-2">
              <AnimatedText
                content="I'm a Master student at Beijing Institute of Technology, School of Automation. My research interests include Robotics and Multimodal Perception. And I recieve my Bachelor's degree from Tsinghua University, Department of Automation."
                delay={0.3}
                duration={0.5}
                stagger={0.015}
                className="text-base text-neutral-700 dark:text-neutral-300"
              />
            </div>
            {/* Second description - AnimatedText animation */}
            <div className="mb-4">
              <AnimatedText
                content="I believe Dynamics, Intelligence and Energy are the foundation of the future."
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
                variant="default"
                size="default"
                className="m-auto sm:m-0"
              >
                Follow me on 𝕏
              </Button>
            </div>
            {/* Social Cards */}
            <div className="mt-8 mb-8">
              <SocialCard displaySocialIds={[1, 2, 3, 4, 5, 6, 7]} />
            </div>
          </div>
          {/* 右侧：HeroCard */}
          <div className="relative mt-16 w-full justify-end md:mt-0 md:flex md:w-1/2 md:translate-y-4 md:pl-4 xl:translate-y-0">
            <HeroCard
              imageUrl="/static/images/avatar.png"
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
