'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

const Footer = memo(() => {
  // 使用 state 和 useEffect 确保 SSR/CSR 一致
  // 初始值设为当前年份（服务器端和客户端通常相同）
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    // 客户端挂载后更新年份（处理跨年情况）
    setCurrentYear(new Date().getFullYear())
  }, [])

  // 社交链接配置（使用useMemo缓存，避免每次渲染创建）
  const socialLinks = useMemo(
    () =>
      [
        { kind: 'mail' as const, href: `mailto:${siteMetadata.email}` },
        siteMetadata.github && { kind: 'github' as const, href: siteMetadata.github },
        siteMetadata.facebook && { kind: 'facebook' as const, href: siteMetadata.facebook },
        siteMetadata.youtube && { kind: 'youtube' as const, href: siteMetadata.youtube },
        siteMetadata.linkedin && { kind: 'linkedin' as const, href: siteMetadata.linkedin },
        siteMetadata.twitter && { kind: 'twitter' as const, href: siteMetadata.twitter },
        siteMetadata.bluesky && { kind: 'bluesky' as const, href: siteMetadata.bluesky },
        siteMetadata.x && { kind: 'x' as const, href: siteMetadata.x },
        siteMetadata.instagram && { kind: 'instagram' as const, href: siteMetadata.instagram },
        siteMetadata.threads && { kind: 'threads' as const, href: siteMetadata.threads },
        siteMetadata.medium && { kind: 'medium' as const, href: siteMetadata.medium },
      ].filter((link): link is { kind: string; href: string } => Boolean(link)),
    []
  )

  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {socialLinks.map((link) => (
            <SocialIcon key={link.kind} kind={link.kind} href={link.href} size={6} />
          ))}
        </div>
        <div className="mb-2 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{siteMetadata.author}</div>
          <div>{` • `}</div>
          <div>{`© ${currentYear}`}</div>
          <div>{` • `}</div>
          <Link href="/">{siteMetadata.title}</Link>
        </div>
        <div className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          <Link href="https://beian.miit.gov.cn/">京ICP备2025110798号-1</Link>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
