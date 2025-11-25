/* eslint-disable jsx-a11y/anchor-has-content */
'use client'

import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { AnchorHTMLAttributes, useRef } from 'react'
import { useRouter } from 'next/navigation'
import prefetchManager from '@/lib/utils/prefetch-manager'
import postPreloader from '@/lib/utils/post-preloader'

// 使用 Omit 排除冲突的属性，然后合并类型
interface CustomLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onMouseEnter'> {
  prefetch?: boolean
  prefetchOnHover?: boolean
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

// 将 href 转换为字符串的辅助函数
function hrefToString(href: LinkProps['href']): string {
  if (typeof href === 'string') {
    return href
  }
  if (typeof href === 'object' && href !== null) {
    // UrlObject 类型：包含 pathname, query, hash 等
    const urlObject = href as { pathname?: string; query?: Record<string, any>; hash?: string }
    let result = urlObject.pathname || ''
    if (urlObject.query) {
      const queryString = new URLSearchParams(urlObject.query as Record<string, string>).toString()
      if (queryString) {
        result += `?${queryString}`
      }
    }
    if (urlObject.hash) {
      result += urlObject.hash
    }
    return result
  }
  return ''
}

const CustomLink = ({
  href,
  prefetch = true,
  prefetchOnHover = true,
  ...rest
}: CustomLinkProps) => {
  const router = useRouter()
  const prefetchedRef = useRef(false)
  const hrefString = hrefToString(href)
  const isInternalLink = hrefString && hrefString.startsWith('/')
  const isAnchorLink = hrefString && hrefString.startsWith('#')

  // 悬停预取处理（使用 PrefetchManager 和 PostPreloader 管理）
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetchOnHover && isInternalLink && hrefString) {
      // 检查是否是文章链接
      const isPostLink = hrefString.startsWith('/blog/') && hrefString !== '/blog'
      if (isPostLink) {
        // 提取 slug
        const slug = hrefString.replace('/blog/', '')
        // 立即预加载文章（最高优先级）
        postPreloader.preloadPost(slug, 'high')
        // 立即处理队列（高优先级任务）
        // 注意：preloadPost 内部会自动处理高优先级任务，这里不需要手动调用
      }

      // 检查是否已预取
      if (!prefetchManager.hasPrefetched(hrefString) && !prefetchedRef.current) {
        // 使用 PrefetchManager 进行预取（自动管理队列和并发）
        prefetchManager.prefetch(hrefString, 'medium')
        prefetchedRef.current = true
      }
    }
    // 调用原有的 onMouseEnter（如果存在）
    if (rest.onMouseEnter) {
      rest.onMouseEnter(e)
    }
  }

  if (isInternalLink) {
    return (
      <Link
        className="break-words"
        href={href}
        prefetch={prefetch}
        onMouseEnter={handleMouseEnter}
        {...rest}
      />
    )
  }

  if (isAnchorLink) {
    return <a className="break-words" href={hrefString} {...rest} />
  }

  return (
    <a
      className="break-words"
      target="_blank"
      rel="noopener noreferrer"
      href={hrefString}
      {...rest}
    />
  )
}

export default CustomLink
