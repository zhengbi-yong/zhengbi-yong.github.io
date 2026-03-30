'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import {
  Mail,
  Github,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  X,
  Mastodon,
  Threads,
  Instagram,
  Medium,
  Bluesky,
} from '@/components/social-icons/icons'
import { useTheme } from 'next-themes'
import { cn } from './lib/utils'

type SocialLink = {
  kind:
    | 'mail'
    | 'github'
    | 'facebook'
    | 'youtube'
    | 'linkedin'
    | 'twitter'
    | 'bluesky'
    | 'x'
    | 'instagram'
    | 'threads'
    | 'medium'
  href: string
  name: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const socialComponents = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  x: X,
  mastodon: Mastodon,
  threads: Threads,
  instagram: Instagram,
  medium: Medium,
  bluesky: Bluesky,
}

const socialNames: Record<string, string> = {
  mail: 'Email',
  github: 'GitHub',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  x: 'X',
  mastodon: 'Mastodon',
  threads: 'Threads',
  instagram: 'Instagram',
  medium: 'Medium',
  bluesky: 'Bluesky',
}

/**
 * Footer - 艺术风格页脚组件
 * 设计要点：
 * 1. 深色背景 (#05080F)
 * 2. Newsreader 斜体标题
 * 3. Inter 超小号文字
 * 4. Material Symbols Outlined 图标
 */
const Footer = memo(() => {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const socialLinks = useMemo(
    () => {
      const links: (SocialLink | null)[] = [
        {
          kind: 'mail' as const,
          href: `mailto:${siteMetadata.email}`,
          name: socialNames.mail,
          Icon: socialComponents.mail,
        },
        siteMetadata.github
          ? {
              kind: 'github' as const,
              href: siteMetadata.github,
              name: socialNames.github,
              Icon: socialComponents.github,
            }
          : null,
        siteMetadata.facebook
          ? {
              kind: 'facebook' as const,
              href: siteMetadata.facebook,
              name: socialNames.facebook,
              Icon: socialComponents.facebook,
            }
          : null,
        siteMetadata.youtube
          ? {
              kind: 'youtube' as const,
              href: siteMetadata.youtube,
              name: socialNames.youtube,
              Icon: socialComponents.youtube,
            }
          : null,
        siteMetadata.linkedin
          ? {
              kind: 'linkedin' as const,
              href: siteMetadata.linkedin,
              name: socialNames.linkedin,
              Icon: socialComponents.linkedin,
            }
          : null,
        siteMetadata.twitter
          ? {
              kind: 'twitter' as const,
              href: siteMetadata.twitter,
              name: socialNames.twitter,
              Icon: socialComponents.twitter,
            }
          : null,
        siteMetadata.bluesky
          ? {
              kind: 'bluesky' as const,
              href: siteMetadata.bluesky,
              name: socialNames.bluesky,
              Icon: socialComponents.bluesky,
            }
          : null,
        siteMetadata.x
          ? {
              kind: 'x' as const,
              href: siteMetadata.x,
              name: socialNames.x,
              Icon: socialComponents.x,
            }
          : null,
        siteMetadata.instagram
          ? {
              kind: 'instagram' as const,
              href: siteMetadata.instagram,
              name: socialNames.instagram,
              Icon: socialComponents.instagram,
            }
          : null,
        siteMetadata.threads
          ? {
              kind: 'threads' as const,
              href: siteMetadata.threads,
              name: socialNames.threads,
              Icon: socialComponents.threads,
            }
          : null,
        siteMetadata.medium
          ? {
              kind: 'medium' as const,
              href: siteMetadata.medium,
              name: socialNames.medium,
              Icon: socialComponents.medium,
            }
          : null,
      ]
      return links.filter((link): link is SocialLink => link !== null)
    },
    []
  )

  return (
    <footer className={cn(
        'w-full py-16 md:py-24 px-6 md:px-12 border-t',
        isDark ? 'border-white/5 bg-[#05080F]' : 'border-black/5 bg-gray-100'
      )}>
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Logo 和版权 */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <Link
            href="/"
            className={cn(
              'text-lg md:text-xl tracking-tight transition-colors duration-300',
              isDark ? 'text-slate-200 hover:text-white' : 'text-gray-800 hover:text-gray-600'
            )}
            style={{ fontFamily: 'var(--font-great-vibes)' }}
          >
            {siteMetadata.title}
          </Link>
          <p className={cn(
            'font-inter text-[9px] uppercase tracking-[0.2rem]',
            isDark ? 'text-slate-600' : 'text-gray-500'
          )}>
            © {currentYear} The Silent Curator. All rights reserved.
          </p>
        </div>

        {/* 导航链接 */}
        <nav className="flex gap-8 md:gap-12">
          <Link
            href="/blog"
            className={cn(
              'font-inter text-[9px] uppercase tracking-[0.2rem] transition-colors duration-500',
              isDark ? 'text-slate-600 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            博客
          </Link>
          <Link
            href="/projects"
            className={cn(
              'font-inter text-[9px] uppercase tracking-[0.2rem] transition-colors duration-500',
              isDark ? 'text-slate-600 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            项目
          </Link>
          <Link
            href="/team"
            className={cn(
              'font-inter text-[9px] uppercase tracking-[0.2rem] transition-colors duration-500',
              isDark ? 'text-slate-600 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            团队
          </Link>
          <Link
            href="/music"
            className={cn(
              'font-inter text-[9px] uppercase tracking-[0.2rem] transition-colors duration-500',
              isDark ? 'text-slate-600 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            音乐
          </Link>
        </nav>

        {/* 社交图标 */}
        <div className="flex gap-4">
          {socialLinks.map((social) => {
            const Icon = social.Icon
            return (
              <a
                key={social.kind}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300"
                title={social.name}
              >
                <span className="sr-only">{social.name}</span>
                <Icon className={cn('w-4 h-4', isDark ? 'text-slate-200' : 'text-gray-700')} />
              </a>
            )
          })}
        </div>
      </div>

      {/* 备案信息 */}
      <div className={cn(
        'max-w-[1920px] mx-auto mt-8 pt-8 border-t text-center',
        isDark ? 'border-white/5' : 'border-black/5'
      )}>
        <Link
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'font-inter text-[9px] uppercase tracking-[0.1rem] transition-colors duration-300',
            isDark ? 'text-slate-700 hover:text-slate-500' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          京ICP备2025110798号-1
        </Link>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
