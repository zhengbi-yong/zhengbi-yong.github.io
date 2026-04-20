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

const primaryLinks = [
  { href: '/blog', label: '博客' },
  { href: '/projects', label: '项目' },
  { href: '/team', label: '团队' },
  { href: '/music', label: '音乐' },
]

const Footer = memo(() => {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const socialLinks = useMemo(() => {
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
  }, [])

  return (
    <footer
      className={cn(styles.footerRoot, 'w-full px-6 py-14 md:px-10 md:py-20 lg:px-12 bg-slate-50 dark:bg-[#05080F] text-slate-900 dark:text-slate-200')}
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className={styles.footerDivider} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
          <section className="flex flex-col gap-4 text-center lg:text-left">
            <div className="space-y-3">
              <Link
                href="/"
                className="inline-block text-2xl tracking-tight transition-colors duration-300 text-slate-900 dark:text-white dark:hover:text-slate-200 hover:text-slate-700"
                style={{ fontFamily: 'var(--font-great-vibes)' }}
              >
                {siteMetadata.title}
              </Link>
              <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                Calm technical writing, research notes, and selected work by Zhengbi Yong.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
              © {currentYear} Zhengbi Yong. All rights reserved.
            </p>
          </section>

          <nav aria-label="Footer navigation" className="flex flex-col gap-4 text-center lg:text-left">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
              Navigate
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    styles.footerLink,
                    'text-sm transition-colors duration-300 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <section className="flex flex-col gap-4 text-center lg:text-left">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
              Connect
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {socialLinks.map((social) => {
                const Icon = social.Icon
                return (
                  <a
                    key={social.kind}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      styles.footerSocialButton,
                      'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    )}
                    title={social.name}
                    aria-label={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    <span className={styles.footerSocialIcon}>
                      <Icon />
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        </div>

        <div className={styles.footerDivider} />

        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs tracking-[0.16em] uppercase text-slate-500 dark:text-slate-600">
            Built with clarity across light and dark themes.
          </p>
          <Link
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              styles.footerLink,
              'text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
            )}
          >
            京ICP备2025110798号-1
          </Link>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
