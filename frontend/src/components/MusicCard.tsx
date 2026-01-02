import Link from './Link'
import { cn } from './lib/utils'

interface MusicCardProps {
  id: string
  title: string
  description?: string
  composer?: string
  year?: string
  className?: string
}

/**
 * MusicCard - 乐谱卡片组件
 * 用于展示乐谱信息，包含标题、描述、作曲家等信息
 */
export default function MusicCard({
  id,
  title,
  description,
  composer,
  year,
  className = '',
}: MusicCardProps) {
  return (
    <Link href={`/music/${id}`} className={cn('group block h-full', className)}>
      <article className="hover:border-primary-300/50 dark:hover:border-primary-600/50 h-full rounded-2xl border border-gray-200/50 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-900/60 dark:hover:shadow-gray-900/50">
        {/* 标题区域 */}
        <div className="mb-4">
          <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2 text-xl font-bold text-gray-900 transition-colors duration-200 dark:text-gray-100">
            {title}
          </h3>
          {(composer || year) && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {composer && <span>{composer}</span>}
              {composer && year && <span>·</span>}
              {year && <span>{year}</span>}
            </div>
          )}
        </div>

        {/* 描述 */}
        {description && (
          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}

        {/* 操作提示 */}
        <div className="text-primary-500 dark:text-primary-400 mt-auto flex items-center gap-2 border-t border-gray-200/50 pt-4 text-sm font-medium dark:border-gray-700/50">
          <span>查看乐谱</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  )
}
