import projectsData from '@/data/projectsData'
import Image from 'next/image'
import Link from 'next/link'
import { genPageMetadata } from '@/app/seo'
import PublicLayout from '@/app/(public)/layout'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <PublicLayout>
      <PublicPageFrame>
        <section className="grid grid-cols-1 gap-x-16 gap-y-20 md:grid-cols-2 md:gap-y-32">
          {projectsData.map((project, index) => (
            <article
              key={project.title}
              className={`group cursor-pointer ${index % 2 === 1 ? 'md:mt-24' : ''}`}
            >
              <Link href={project.href || '#'} className="block h-full">
                <div className="h-full border border-border/70 bg-background/90 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:bg-background dark:border-border/80 dark:dark:bg-card/60 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.95)] dark:group-hover:border-primary/20 dark:group-hover:dark:bg-card/90 md:p-10">
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
                      <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-primary dark:text-primary">
                        {project.category}
                        {project.year && ` / ${project.year}`}
                      </span>
                    )}
                    <h2
                      className="text-2xl font-semibold tracking-tight text-[var(--theme-fg)] md:text-3xl"
                      style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
                      {project.title}
                    </h2>
                    <p className="max-w-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                      {project.description}
                    </p>
                    <div className="pt-2">
                      <span className="border-b border-border pb-1 text-sm font-medium uppercase tracking-[0.14em] text-primary transition-colors duration-300 group-hover:border-primary dark:border-border dark:text-primary dark:group-hover:border-primary">
                        查看详情
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>

        {projectsData.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-zinc-400 dark:text-muted-foreground">暂无项目</p>
          </div>
        )}
      </PublicPageFrame>
    </PublicLayout>
  )
}
