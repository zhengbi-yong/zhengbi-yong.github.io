/* eslint-disable jsx-a11y/anchor-has-content */
'use client'

import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { AnchorHTMLAttributes, useRef } from 'react'
import prefetchManager from '@/lib/utils/prefetch-manager'
import postPreloader from '@/lib/utils/post-preloader'

// 使用 Omit 排除冲突的属性，然后合并类型
interface CustomLinkProps
  extends LinkProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onMouseEnter'> {
  prefetch?: boolean
  prefetchOnHover?: boolean
  onMouseEnter?: (_e: React.MouseEvent<HTMLAnchorElement>) => void
}

// 将 href 转换为字符串的辅助函数
function hrefToString(href: LinkProps['href']): string {
  if (typeof href === 'string') {
    return href
  }
  if (typeof href === 'object' && href !== null) {
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

// 悬停预取处理函数
function handleMouseEnter(
  _e: React.MouseEvent<HTMLAnchorElement>,
  hrefString: string,
  isInternalLink: boolean,
  prefetchOnHover: boolean,
  prefetchedRef: React.MutableRefObject<boolean>
): void {
  if (prefetchOnHover && isInternalLink && hrefString) {
    const isPostLink = hrefString.startsWith('/blog/') && hrefString !== '/blog'
    if (isPostLink) {
      const slug = hrefString.replace('/blog/', '')
      postPreloader.preloadPost(slug, 'high')
    }
    
    if (!prefetchManager.hasPrefetched(hrefString) && !prefetchedRef.current) {
      prefetchManager.prefetch(hrefString, 'medium')
      prefetchedRef.current = true
    }
  }
}

const CustomLink = ({
  href,
  prefetch = true,
  prefetchOnHover = true,
  ...rest
}: CustomLinkProps) => {
  const prefetchedRef = useRef(false)
  const hrefString = hrefToString(href)
  const isInternalLink = typeof href === 'string' && href.startsWith('/')

  const handleMouseEnterFn = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    handleMouseEnter(_e, hrefString, isInternalLink, prefetchOnHover, prefetchedRef)
    if (rest.onMouseEnter) {
      rest.onMouseEnter(_e)
    }
  }

  // 内部链接使用 Next.js Link 组件（避免 hydration 错误）
  if (isInternalLink) {
    return (
      <Link
        className="break-words"
        href={href}
        prefetch={prefetch}
        onMouseEnter={handleMouseEnterFn}
        {...rest}
      />
    )
  }

  // 外部链接使用原生 a 标签（避免嵌套 Link 导致 hydration 错误）
  if (!isInternalLink) {
    return <a className="break-words" href={hrefString} {...rest} />
  }
  return null
}

export default CustomLink
