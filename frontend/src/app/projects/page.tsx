import projectsData from '@/data/projectsData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shadcn/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { genPageMetadata } from '@/app/seo'

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
                  <Link href={d.href} key={d.title} className="group h-full">
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                      {d.imgSrc && (
                        <div className="relative overflow-hidden rounded-t-2xl h-48 md:h-56 lg:h-64">
                          <Image
                            alt={d.title}
                            src={d.imgSrc}
                            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            width={544}
                            height={306}
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <CardHeader className="p-0 mb-4">
                          <CardTitle className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {d.title}
                          </CardTitle>
                          <CardDescription>{d.description}</CardDescription>
                        </CardHeader>
                        <span
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 group/link inline-flex items-center gap-2 text-base leading-6 font-medium transition-all duration-200"
                        >
                          <span className="relative">
                            了解更多
                            <span className="bg-primary-500 dark:bg-primary-400 absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-300 group-hover/link:w-full"></span>
                          </span>
                          <span className="transition-transform duration-300 group-hover/link:translate-x-1">
                            →
                          </span>
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
