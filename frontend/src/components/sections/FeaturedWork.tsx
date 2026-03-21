'use client'

import projectsData from '@/data/projectsData'
import WorkCard from './WorkCard'
import SectionHeader from './SectionHeader'
import { Button } from '@/components/shadcn/ui/button'
import Link from 'next/link'

interface Project {
  name: string
  description?: string
  image: string
  url: string
  tags?: string[]
  video?: string
  isShow?: boolean
}

interface FeaturedWorkProps {
  title?: string
  description?: string
  showAll?: boolean
  limit?: number
}

/**
 * FeaturedWork - 精选作品部分组件
 * 基于提供的 Astro FeaturedWork 组件转换而来
 * 前3个项目为特色项目（全宽显示），其余为网格项目（两栏显示）
 */
export default function FeaturedWork({
  title = 'Featured Work',
  description = "A selection of projects I've worked on. From web applications to design systems, each project represents a unique challenge and learning experience.",
  showAll = false,
  limit,
}: FeaturedWorkProps) {
  // 将 projectsData 转换为 WorkCard 需要的格式
  const allProjects: Project[] = projectsData.map((project) => ({
    name: project.title,
    description: project.description,
    image: project.imgSrc || '',
    url: project.href || '#',
    tags: [],
    video: undefined,
    isShow: true,
  }))

  // 根据 limit 或 showAll 来控制显示数量
  let displayedProjects = allProjects
  if (limit !== undefined) {
    // 如果指定了 limit，使用 limit
    displayedProjects = allProjects.slice(0, limit)
  } else if (!showAll) {
    // 如果没有指定 limit，且 showAll 为 false，默认显示 6 个
    displayedProjects = allProjects.slice(0, 6)
  }
  // 如果 showAll 为 true 且没有 limit，显示所有项目

  // 前三个为特色项目（全宽）
  const featuredProjects = displayedProjects.slice(0, 3)

  // 其余为网格项目（两栏）
  const gridProjects = displayedProjects.slice(3)

  // 判断是否应该显示 "View All" 按钮
  const shouldShowViewAll =
    limit !== undefined ? limit < allProjects.length : !showAll && allProjects.length > 6

  return (
    <section className="py-16 md:py-16 md:pb-12">
      <div className="container mx-auto space-y-8 px-4 sm:px-6 md:space-y-8 xl:px-8">
        {/* 标题部分 */}
        <SectionHeader title={title} description={description} />

        {/* 特色项目 - 全宽显示 */}
        {featuredProjects.length > 0 && (
          <div className="space-y-8 md:space-y-10">
            {featuredProjects
              .filter((project) => project.isShow !== false)
              .map((project, index) => (
                <WorkCard
                  key={project.name}
                  name={project.name}
                  description={project.description}
                  image={project.image}
                  url={project.url}
                  tags={project.tags}
                  video={project.video}
                  isShow={project.isShow}
                  layout="featured"
                  index={index}
                />
              ))}
          </div>
        )}

        {/* 网格项目 - 两栏显示 */}
        {gridProjects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {gridProjects
              .filter((project) => project.isShow !== false)
              .map((project, index) => (
                <WorkCard
                  key={project.name}
                  name={project.name}
                  description={project.description}
                  image={project.image}
                  url={project.url}
                  tags={project.tags}
                  video={project.video}
                  isShow={project.isShow}
                  layout="grid"
                  index={featuredProjects.length + index}
                />
              ))}
          </div>
        )}

        {/* See More 按钮 (可选) */}
        {shouldShowViewAll && (
          <div className="flex items-center justify-center pt-4">
            <Link href="/works" className="w-full max-w-60">
              <Button className="w-full">
                See All Works
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
