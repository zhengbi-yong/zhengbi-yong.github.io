import { genPageMetadata } from '@/app/seo'
import musicSheets from '@/data/musicData'
import Link from 'next/link'

export const metadata = genPageMetadata({ title: 'Music' })

export default function MusicPage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          {/* Music Score Gallery */}
          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {musicSheets.map((music) => (
              <article key={music.id} className="group">
                <Link href={`/music/${music.id}`} className="block">
                  {/* Score Card */}
                  <div className="relative overflow-hidden rounded-sm bg-zinc-100 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-amber-900/10 dark:bg-zinc-900/60 dark:group-hover:shadow-amber-500/5">
                    {/* Score Preview Area */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                      {/* Decorative staff lines */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.07] dark:opacity-[0.05]">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className="h-px w-3/5 bg-zinc-600 dark:bg-zinc-300"
                            style={{ marginTop: i === 0 ? '0' : '12px', marginBottom: '12px' }}
                          />
                        ))}
                      </div>

                      {/* Music note icon centered */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1}
                          className="h-20 w-20 text-zinc-300 transition-colors duration-500 group-hover:text-amber-600/60 dark:text-zinc-700 dark:group-hover:text-amber-400/40"
                        >
                          <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>

                      {/* Category Badge */}
                      {music.category && (
                        <div className="absolute left-4 top-4">
                          <span className="inline-block bg-amber-700/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-50 dark:bg-amber-600/80 dark:text-amber-50">
                            {music.category}
                          </span>
                        </div>
                      )}

                      {/* Difficulty Badge */}
                      {music.difficulty && (
                        <div className="absolute right-4 top-4">
                          <span className="inline-block border border-zinc-300/60 bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-800/80 dark:text-zinc-400">
                            {music.difficulty}
                          </span>
                        </div>
                      )}

                      {/* Bottom gradient overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-100 via-zinc-100/60 to-transparent dark:from-zinc-900 dark:via-zinc-900/60 dark:to-transparent" />
                    </div>

                    {/* Card Content */}
                    <div className="px-5 pb-6 pt-4">
                      {/* Title */}
                      <h3
                        className="mb-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                        style={{ fontFamily: 'var(--font-newsreader)' }}
                      >
                        {music.title}
                      </h3>

                      {/* Composer & Year */}
                      {(music.composer || music.year) && (
                        <div className="mb-3 flex items-center gap-2">
                          {music.composer && (
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {music.composer}
                            </span>
                          )}
                          {music.composer && music.year && (
                            <span className="text-zinc-300 dark:text-zinc-600">|</span>
                          )}
                          {music.year && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {music.year}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {music.description && (
                        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {music.description}
                        </p>
                      )}

                      {/* Instrument tag */}
                      {music.instrument && (
                        <div className="mb-3">
                          <span className="inline-block text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700/70 dark:text-amber-500/60">
                            {music.instrument}
                          </span>
                        </div>
                      )}

                      {/* View Score Link */}
                      <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/40">
                        <span className="text-xs font-medium tracking-wide text-amber-700 transition-colors duration-300 group-hover:text-amber-600 dark:text-amber-500 dark:group-hover:text-amber-400">
                          查看乐谱 →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </section>

          {/* Empty state */}
          {musicSheets.length === 0 && (
            <div className="py-32 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">暂无乐谱</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
