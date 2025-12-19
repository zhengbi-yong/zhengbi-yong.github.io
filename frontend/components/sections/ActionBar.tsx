'use client'

import { motion } from 'framer-motion'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { cn } from '@/components/lib/utils'

type LogoInput = string | { src: string }

interface ActionBarProps {
  logo?: LogoInput
  tags?: string[]
  url?: string
  github?: string
  visitLabel?: string
  className?: string
}

/**
 * normalizeLogo - 标准化 logo 输入
 * 支持 URL 字符串或包含 src 的对象
 */
function normalizeLogo(logo?: LogoInput): string | null {
  if (!logo) return null

  if (typeof logo === 'string') {
    const isUrlLike =
      logo.startsWith('/') || logo.startsWith('http') || /\.(png|jpe?g|webp|svg)$/i.test(logo)
    if (isUrlLike) return logo
    // 如果是单个字符，返回 null，将显示文字
    return null
  }

  if (typeof logo === 'object' && 'src' in logo) {
    return logo.src as string
  }

  return null
}

/**
 * ActionBar - 操作栏组件
 * 参考 Astro 项目的 ActionBar 组件，适配项目现有风格
 * 固定在底部居中，包含 logo、标签、GitHub 链接和主要按钮
 */
export default function ActionBar({
  logo = '',
  tags = ['Website'],
  url = '#',
  github = '',
  visitLabel = 'Visit Site',
  className = '',
}: ActionBarProps) {
  const logoSrc = normalizeLogo(logo)
  const displayText = typeof logo === 'string' && logo && !logoSrc ? logo : 'W.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className={cn(
        'fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 sm:bottom-6 md:bottom-8',
        className
      )}
    >
      <div className="flex max-w-[92vw] items-center gap-1 rounded-2xl bg-neutral-900/85 px-2 py-2 text-neutral-100 shadow-[0_6px_28px_rgba(0,0,0,0.25)] ring-1 ring-white/10 backdrop-blur-xl sm:gap-2 dark:bg-neutral-900/85">
        {/* Logo block */}
        <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-800 ring-1 ring-white/10 sm:h-10 sm:w-10">
          {logoSrc ? (
            <Image src={logoSrc} alt="logo" fill className="object-cover" loading="lazy" />
          ) : (
            <span className="text-lg font-semibold tracking-tight sm:text-xl">{displayText}</span>
          )}
        </div>

        {/* Middle pills (tags + optional github) */}
        <div className="scrollbar-none flex max-w-[46vw] items-center gap-1 overflow-x-auto pr-1 sm:max-w-[52vw] sm:gap-1 md:max-w-[56vw]">
          {tags &&
            tags.map((tag, index) => (
              <span
                key={index}
                className="hidden h-10 items-center rounded-xl bg-neutral-800/80 px-3 text-sm font-light whitespace-nowrap text-neutral-300 ring-1 ring-white/10 sm:inline-flex sm:px-3"
              >
                {tag}
              </span>
            ))}

          {github && (
            <Link
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="inline-flex h-10 items-center rounded-xl bg-neutral-800/80 px-3 text-sm whitespace-nowrap text-neutral-200 ring-1 ring-white/10 transition-colors hover:bg-neutral-700/80 hover:text-white sm:px-3 sm:text-[15px]"
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                aria-hidden="true"
                className="size-5 opacity-90"
              >
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
            </Link>
          )}
        </div>

        {/* Primary button */}
        <div className="shrink-0">
          <Link
            href={url}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex h-10 items-center rounded-xl bg-yellow-300 px-4 text-sm whitespace-nowrap text-neutral-900 transition-colors hover:bg-yellow-200 sm:h-11 sm:px-5"
          >
            {visitLabel}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
