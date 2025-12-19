import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'
import ShaderBackgroundClient from '@/components/ShaderBackgroundClient'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundClient intensity={0.8} />
      </div>
      {/* 项目内容 */}
      <div className="relative z-10">
        {/* 内容背景遮罩 - 提升文字可读性 */}
        <div className="fixed inset-0 -z-[5] bg-white/50 backdrop-blur-sm dark:bg-gray-950/60" />
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* 标题区域 - 居中 */}
          <div className="pt-8 pb-10 md:pt-12 md:pb-12">
            <div className="mb-8 text-center md:mb-10">
              <h1 className="mx-auto mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl leading-tight font-extrabold tracking-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
                项目
              </h1>
              <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-400">
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
