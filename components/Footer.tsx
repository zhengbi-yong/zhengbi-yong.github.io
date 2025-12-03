'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import Link from './Link'
import Logo from './Logo'
import BackToTop from './BackToTop'
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
import { cn } from './lib/utils'
import styles from './Footer.module.css'

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
 * Footer - 页脚组件
 * 基于提供的 Astro Footer 组件转换而来
 */
const Footer = memo(() => {
  // 使用 state 和 useEffect 确保 SSR/CSR 一致
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    // 客户端挂载后更新年份（处理跨年情况）
    setCurrentYear(new Date().getFullYear())
  }, [])

  // 社交链接配置（使用useMemo缓存，避免每次渲染创建）
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
    <>
      <section
        className="text-gray-700 border-t mt-20 md:mt-48 border-dashed border-primary/15 dark:border-primary-dark/15 border-[.75px]"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <div className="container flex flex-col items-center py-8 mx-auto px-7 max-w-7xl sm:flex-row">
          <Logo />

          <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-100 sm:ml-4 sm:pl-4 sm:border-l sm:border-neutral-300 dark:sm:border-neutral-700 sm:mt-0">
            <p>
              © {currentYear}{' '}
              <a
                href={siteMetadata.siteUrl || ' '}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                {siteMetadata.author || ' '}
              </a>
            </p>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Link href="https://beian.miit.gov.cn/" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                京ICP备2025110798号-1
              </Link>
            </p>
          </div>

          <span
            className="inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start overflow-hidden"
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          >
            {socialLinks.map((social) => {
              const Icon = social.Icon
              // 根据平台设置不同的类名以支持 hover 颜色
              const iconClassName = cn(
                social.kind === 'twitter' || social.kind === 'x' ? 'icTwitter' : '',
                social.kind === 'github' ? 'icGithub' : ''
              )

              return (
                <a
                  key={social.kind}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    styles.footerSocialIconLink,
                    'text-neutral-500 dark:text-neutral-300'
                  )}
                  title={social.name}
                  style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                >
                  <span className="sr-only">{social.name}</span>
                  <div className={styles.footerSocialIcon}>
                    <Icon className={iconClassName} />
                  </div>
                </a>
              )
            })}
          </span>
        </div>
      </section>

      {/* 返回顶部按钮 */}
      <BackToTop />
    </>
  )
})

Footer.displayName = 'Footer'

export default Footer
