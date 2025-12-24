import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <div className="relative min-h-screen">
      {/* 项目内容 */}
      <div className="relative z-10">
        <div className="divide-y divide-border">
          {/* 标题区域 - 居中 */}
          <div className="pt-8 pb-10 md:pt-12 md:pb-12">
            <div className="mb-8 text-center md:mb-10">
              <h1 className="mx-auto mb-4 text-4xl leading-tight font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight">
                项目
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                研究和学术项目
              </p>
            </div>
          </div>
          {/* 项目卡片区域 */}
          <div className="py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                {projectsData.map((d) => (
                  <Card
                    key={d.title}
                    title={d.title}
                    description={d.description}
                    imgSrc={d.imgSrc}
                    href={d.href}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
