import { genPageMetadata } from '@/app/seo'
import teamMembers from '@/data/teamData'
import Image from 'next/image'
import PublicLayout from '@/app/(public)/layout'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'

export const metadata = genPageMetadata({ title: 'Team' })

export default function TeamPage() {
  return (
    <PublicLayout>
      <PublicPageFrame>
        <section>
          {/* Advisor section */}
          {teamMembers.filter((m) => m.role === 'Advisor').length > 0 && (
            <div className="mb-16 md:mb-24">
              <h2 className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500 md:mb-14">
                指导教师
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
                {teamMembers
                  .filter((m) => m.role === 'Advisor')
                  .map((member) => (
                    <article key={member.id} className="group">
                      <div className="border border-zinc-200/70 bg-zinc-50/90 p-8 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-amber-700/30 group-hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.95)] dark:group-hover:border-amber-500/20 dark:group-hover:bg-zinc-900/90 md:p-10">
                        <div className="flex gap-8">
                          {member.avatar ? (
                            <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <Image
                                alt={member.name}
                                src={member.avatar}
                                className="h-full w-full object-cover"
                                width={112}
                                height={112}
                              />
                            </div>
                          ) : (
                            <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                              <span
                                className="text-3xl font-light text-amber-700 dark:text-amber-400"
                                style={{ fontFamily: 'var(--font-newsreader)' }}
                              >
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3
                              className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name}
                            </h3>
                            {member.nameEn && (
                              <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
                                {member.nameEn}
                              </p>
                            )}
                            <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-500">
                              {member.title}
                              {member.affiliation && ` · ${member.affiliation}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <p className="max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {member.bio}
                          </p>
                          {member.research && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {member.research.map((tag) => (
                                <span
                                  key={tag}
                                  className="border border-zinc-200 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(member.email || member.website) && (
                            <div className="mt-4 flex items-center gap-4">
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="text-xs text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-400"
                                >
                                  Email
                                </a>
                              )}
                              {member.website && (
                                <a
                                  href={member.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-400"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}

          {/* Core Members section */}
          {teamMembers.filter((m) => m.role === 'Lead' || m.role === 'Member').length > 0 && (
            <div>
              <h2 className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500 md:mb-14">
                团队成员
              </h2>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                {teamMembers
                  .filter((m) => m.role === 'Lead' || m.role === 'Member')
                  .map((member) => (
                    <article key={member.id} className="group">
                      <div className="h-full border border-zinc-200/70 bg-zinc-50/90 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-amber-700/30 group-hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.95)] dark:group-hover:border-amber-500/20 dark:group-hover:bg-zinc-900/90 md:p-8">
                        <div className="flex items-center gap-5">
                          {member.avatar ? (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <Image
                                alt={member.name}
                                src={member.avatar}
                                className="h-full w-full object-cover"
                                width={64}
                                height={64}
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                              <span
                                className="text-xl font-light text-amber-700 dark:text-amber-400"
                                style={{ fontFamily: 'var(--font-newsreader)' }}
                              >
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3
                              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name}
                            </h3>
                            {member.nameEn && (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500">{member.nameEn}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-medium text-amber-700/70 dark:text-amber-500/60">
                            {member.title}
                            {member.affiliation && ` · ${member.affiliation}`}
                          </p>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {member.bio}
                        </p>

                        {member.research && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {member.research.map((tag) => (
                              <span
                                key={tag}
                                className="border border-zinc-200 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {(member.email || member.github || member.website) && (
                          <div className="mt-4 flex items-center gap-4 border-t border-zinc-200/60 pt-3 dark:border-zinc-700/40">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="text-xs text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-400"
                              >
                                Email
                              </a>
                            )}
                            {member.github && (
                              <a
                                href={`https://github.com/${member.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-400"
                              >
                                GitHub
                              </a>
                            )}
                            {member.website && (
                              <a
                                href={member.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-400"
                              >
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {teamMembers.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">暂无团队成员</p>
            </div>
          )}
        </section>
      </PublicPageFrame>
    </PublicLayout>
  )
}
