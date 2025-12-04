import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'
import ShaderBackgroundWrapper from '@/components/ShaderBackgroundWrapper'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundWrapper intensity={0.8} />
      </div>
      {/* 项目内容 */}
      <div className="relative z-10">
        {/* 内容背景遮罩 - 提升文字可读性 */}
        <div className="fixed inset-0 -z-[5] bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm" />
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="space-y-2 pt-6 pb-8 md:space-y-5">
            <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
              项目
            </h1>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">研究和学术项目</p>
          </div>
          <div className="container py-12">
            <div className="-m-4 flex flex-wrap">
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
  )
}
