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
    <Link
      href={`/music/${id}`}
      className={cn(
        'group block h-full',
        className
      )}
    >
      <article className="h-full rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-primary-300/50 dark:hover:border-primary-600/50">
        {/* 标题区域 */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
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
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* 操作提示 */}
        <div className="flex items-center gap-2 text-primary-500 dark:text-primary-400 text-sm font-medium mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <span>查看乐谱</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  )
}

