import projectsData from '@/data/projectsData'
import Image from 'next/image'
import Link from 'next/link'
import { genPageMetadata } from '@/app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          {/* Editorial Project Grid */}
          <section className="grid grid-cols-1 gap-x-16 gap-y-20 md:grid-cols-2 md:gap-y-32">
            {projectsData.map((project, index) => (
              <article
                key={project.title}
                className={`group cursor-pointer ${index % 2 === 1 ? 'md:mt-24' : ''}`}
              >
                <Link
                  href={project.href || '#'}
                  className="block h-full"
                >
                  <div className="h-full bg-zinc-50 p-6 transition-all duration-500 group-hover:bg-zinc-100 dark:bg-zinc-900/50 dark:group-hover:bg-zinc-800/50 md:p-10">
                    {project.imgSrc && (
                      <div className="relative mb-8 aspect-[4/5] overflow-hidden md:mb-10">
                        <Image
                          alt={project.title}
                          src={project.imgSrc}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          width={544}
                          height={680}
                        />
                      </div>
                    )}
                    <div className="space-y-4">
                      {project.category && (
                        <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
                          {project.category}
                          {project.year && ` / ${project.year}`}
                        </span>
                      )}
                      <h2
                        className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl"
                        style={{ fontFamily: 'var(--font-newsreader)' }}
                      >
                        {project.title}
                      </h2>
                      <p className="max-w-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {project.description}
                      </p>
                      <div className="pt-2">
                        <span className="border-b border-zinc-300 pb-1 text-sm font-medium text-amber-700 transition-colors duration-300 group-hover:border-amber-700 dark:border-zinc-600 dark:text-amber-500 dark:group-hover:border-amber-500">
                          查看详情
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </section>

          {/* Empty state */}
          {projectsData.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">暂无项目</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
