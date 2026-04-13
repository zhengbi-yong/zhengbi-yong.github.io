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
      <article className="h-full rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all duration-[var(--motion-base)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)]">
        {/* 标题区域 */}
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-[var(--motion-fast)] group-hover:text-[var(--brand-color)]">
            {title}
          </h3>
          {(composer || year) && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
              {composer && <span>{composer}</span>}
              {composer && year && <span>·</span>}
              {year && <span>{year}</span>}
            </div>
          )}
        </div>

        {/* 描述 */}
        {description && (
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-soft)]">
            {description}
          </p>
        )}

        {/* 操作提示 */}
        <div className="text-primary-500 dark:text-primary-400 mt-auto flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4 text-sm font-medium">
          <span>查看乐谱</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  )
}
