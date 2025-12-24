import { genPageMetadata } from 'app/seo'
import MusicCard from '@/components/MusicCard'
import musicSheets from '@/data/musicData'

export const metadata = genPageMetadata({ title: 'Music' })

export default function MusicPage() {
  return (
    <div className="relative min-h-screen">
      {/* 音乐内容 */}
      <div className="relative z-10">
        <div className="divide-y divide-border">
          {/* 标题区域 - 居中 */}
          <div className="pt-8 pb-10 md:pt-12 md:pb-12">
            <div className="mb-8 text-center md:mb-10">
              <h1 className="mx-auto mb-4 text-4xl leading-tight font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight">
                音乐
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                探索我的音乐作品和乐谱收藏
              </p>
            </div>
          </div>
          {/* 乐谱卡片区域 */}
          <div className="py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {musicSheets.map((music) => (
                  <MusicCard
                    key={music.id}
                    id={music.id}
                    title={music.title}
                    description={music.description}
                    composer={music.composer}
                    year={music.year}
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
