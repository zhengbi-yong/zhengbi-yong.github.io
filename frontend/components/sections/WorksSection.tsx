'use client'

import worksData from '@/works.json'
import WorkCard from './WorkCard'

interface Work {
  name: string
  description?: string
  image: string
  url: string
  tags?: string[]
  video?: string | null
  isShow?: boolean
}

interface WorksSectionProps {
  limit?: number
}

/**
 * WorksSection - 作品列表部分组件
 * 基于提供的 Astro WorksSection 组件转换而来
 * 所有项目全宽显示（使用 featured 布局）
 */
export default function WorksSection({ limit }: WorksSectionProps) {
  // 获取项目列表
  let allWorks = worksData as Work[]

  // 如果指定了 limit，使用 limit
  if (limit !== undefined) {
    allWorks = worksData.slice(0, limit) as Work[]
  }

  return (
    <section className="py-8 md:py-8">
      <div className="space-y-8 md:space-y-10">
        {/* 所有项目全宽显示 */}
        {allWorks
          .filter((work) => work.isShow !== false)
          .map((work, index) => (
            <WorkCard
              key={work.name}
              name={work.name}
              description={work.description}
              image={work.image}
              url={work.url}
              tags={work.tags}
              video={work.video}
              isShow={work.isShow}
              layout="featured"
              index={index}
            />
          ))}
      </div>
    </section>
  )
}
