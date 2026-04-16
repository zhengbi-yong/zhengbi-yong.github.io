import { genPageMetadata } from '@/app/seo'
import musicSheets from '@/data/musicData'
import Link from 'next/link'
import PublicLayout from '@/app/(public)/layout'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'

export const metadata = genPageMetadata({ title: 'Music' })

export default function MusicPage() {
  return (
    <PublicLayout>
      <PublicPageFrame>
        {/* Page Header */}
        <div className="mb-12 mt-4">
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-500">
                Sheet Music Collection
              </p>
              <h1
                className="text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                乐谱库
              </h1>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                共 {musicSheets.length} 张乐谱
              </p>
            </div>
            {/* 装饰性五线谱 */}
            <div className="hidden md:block opacity-[0.04] dark:opacity-[0.06]" aria-hidden="true">
              <svg width="280" height="60" viewBox="0 0 280 60">
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={8 + i * 8} x2="280" y2={8 + i * 8}
                    stroke="currentColor" strokeWidth="0.8" />
                ))}
                <g fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M10 44 C10 44 6 36 10 28 C14 20 20 12 24 6 C28 12 24 20 20 28 L20 48" />
                  <circle cx="24" cy="18" r="2.5" />
                  <circle cx="24" cy="26" r="2.5" />
                  <circle cx="24" cy="34" r="2.5" />
                </g>
                <ellipse cx="80" cy="36" rx="4" ry="3.5" fill="currentColor" transform="rotate(-15, 80, 36)" />
                <line x1="83" y1="36" x2="83" y2="12" stroke="currentColor" strokeWidth="1.2" />
                <line x1="140" y1="8" x2="140" y2="48" stroke="currentColor" strokeWidth="0.8" />
                <ellipse cx="180" cy="32" rx="4" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(-15, 180, 32)" />
                <line x1="183" y1="32" x2="183" y2="8" stroke="currentColor" strokeWidth="1.2" />
                <line x1="220" y1="8" x2="220" y2="48" stroke="currentColor" strokeWidth="0.8" />
                <ellipse cx="255" cy="34" rx="4" ry="3.5" fill="currentColor" transform="rotate(-15, 255, 34)" />
                <line x1="258" y1="34" x2="258" y2="10" stroke="currentColor" strokeWidth="1.2" />
                <path d="M258 10 Q265 18 258 34" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {musicSheets.map((music) => (
            <article key={music.id} className="group">
              <Link href={`/music/${music.id}`} className="block">
                <div className="relative overflow-hidden border border-zinc-200/70 bg-zinc-50/90 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-amber-700/30 group-hover:bg-white group-hover:shadow-[0_30px_90px_-58px_rgba(180,83,9,0.28)] dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.95)] dark:group-hover:border-amber-500/20 dark:group-hover:bg-zinc-900/90 dark:group-hover:shadow-[0_30px_90px_-58px_rgba(245,158,11,0.14)]">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                    {/* 五线谱音符 SVG 占位图 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-[0.08] dark:opacity-[0.06]">
                      {/* 小节线 */}
                      <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        {/* 乐谱线条 */}
                        {[0, 1, 2, 3, 4].map(i => (
                          <line key={i} x1="10" y1={20 + i * 10} x2="190" y2={20 + i * 10}
                            stroke="currentColor" strokeWidth="0.8" />
                        ))}
                        {/* 高音谱号 */}
                        <g transform="translate(15, 25)" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M8 35 C8 35 4 28 8 20 C12 12 18 5 22 0 C26 5 22 12 18 20 L18 38" />
                          <circle cx="22" cy="12" r="2.5" />
                          <circle cx="22" cy="18" r="2.5" />
                          <circle cx="22" cy="24" r="2.5" />
                          <circle cx="22" cy="30" r="2.5" />
                        </g>
                        {/* 音符示例 - 四分音符 */}
                        <g>
                          <ellipse cx="70" cy="42" rx="5" ry="4" fill="currentColor" transform="rotate(-15, 70, 42)" />
                          <line x1="74" y1="42" x2="74" y2="20" stroke="currentColor" strokeWidth="1.2" />
                        </g>
                        {/* 音符示例 - 二分音符 */}
                        <g>
                          <ellipse cx="110" cy="38" rx="5" ry="4" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(-15, 110, 38)" />
                          <line x1="114" y1="38" x2="114" y2="16" stroke="currentColor" strokeWidth="1.2" />
                        </g>
                        {/* 音符示例 - 八分音符 */}
                        <g>
                          <ellipse cx="150" cy="40" rx="4" ry="3.5" fill="currentColor" transform="rotate(-15, 150, 40)" />
                          <line x1="153" y1="40" x2="153" y2="18" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M153 18 Q160 25 153 40" stroke="currentColor" strokeWidth="1" fill="none" />
                        </g>
                        {/* 小节线 */}
                        <line x1="90" y1="20" x2="90" y2="60" stroke="currentColor" strokeWidth="0.8" />
                        <line x1="130" y1="20" x2="130" y2="60" stroke="currentColor" strokeWidth="0.8" />
                        {/* 终止线 */}
                        <line x1="185" y1="20" x2="185" y2="60" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>

                    {/* 渐变叠加 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/20 to-transparent dark:from-zinc-900 dark:via-zinc-900/20 dark:to-transparent" />

                    {music.category && (
                      <div className="absolute left-4 top-4">
                        <span className="inline-block bg-amber-700/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-50 dark:bg-amber-600/80 dark:text-amber-50">
                          {music.category}
                        </span>
                      </div>
                    )}

                    {music.difficulty && (
                      <div className="absolute right-4 top-4">
                        <span className="inline-block border border-zinc-300/60 bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-800/80 dark:text-zinc-400">
                          {music.difficulty}
                        </span>
                      </div>
                    )}

                    {/* 乐器标签 */}
                    {music.instrument && (
                      <div className="absolute left-4 bottom-4">
                        <span className="inline-block bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 dark:bg-white/10 dark:text-white/80">
                          {music.instrument}
                        </span>
                      </div>
                    )}

                    {/* 悬停时显示播放指示 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg backdrop-blur-sm">
                        <svg className="w-6 h-6 text-amber-700 dark:text-amber-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-6 pt-4">
                    <h3
                      className="mb-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                      style={{ fontFamily: 'var(--font-newsreader)' }}
                    >
                      {music.title}
                    </h3>

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
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">{music.year}</span>
                        )}
                      </div>
                    )}

                    {music.description && (
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {music.description}
                      </p>
                    )}

                    {music.instrument && (
                      <div className="mb-3">
                        <span className="inline-block text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700/70 dark:text-amber-500/60">
                          {music.instrument}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-zinc-200/60 pt-3 dark:border-zinc-700/40">
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700 transition-colors duration-300 group-hover:text-amber-600 dark:text-amber-500 dark:group-hover:text-amber-400">
                        查看乐谱 →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>

        {musicSheets.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">暂无乐谱</p>
          </div>
        )}
      </PublicPageFrame>
    </PublicLayout>
  )
}
