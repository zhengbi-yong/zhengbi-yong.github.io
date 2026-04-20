'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import siteMetadata from '@/data/siteMetadata'
import { cn } from '@/components/lib/utils'
import styles from '@/components/Footer.module.css'
import {
  Mail,
  Github,
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

const socialLinks = [
  { key: 'mail', href: `mailto:${siteMetadata.email}`, Icon: Mail, show: !!siteMetadata.email, label: 'Email' },
  { key: 'github', href: siteMetadata.github, Icon: Github, show: !!siteMetadata.github, label: 'GitHub' },
  { key: 'linkedin', href: siteMetadata.linkedin, Icon: Linkedin, show: !!siteMetadata.linkedin, label: 'LinkedIn' },
  { key: 'x', href: siteMetadata.x, Icon: X, show: !!siteMetadata.x, label: 'X' },
  { key: 'twitter', href: siteMetadata.twitter, Icon: Twitter, show: !!siteMetadata.twitter, label: 'Twitter' },
  { key: 'youtube', href: siteMetadata.youtube, Icon: Youtube, show: !!siteMetadata.youtube, label: 'YouTube' },
  { key: 'instagram', href: siteMetadata.instagram, Icon: Instagram, show: !!siteMetadata.instagram, label: 'Instagram' },
  { key: 'medium', href: siteMetadata.medium, Icon: Medium, show: !!siteMetadata.medium, label: 'Medium' },
  { key: 'bluesky', href: siteMetadata.bluesky, Icon: Bluesky, show: !!siteMetadata.bluesky, label: 'Bluesky' },
  { key: 'mastodon', href: siteMetadata.mastodon, Icon: Mastodon, show: !!siteMetadata.mastodon, label: 'Mastodon' },
  { key: 'threads', href: siteMetadata.threads, Icon: Threads, show: !!siteMetadata.threads, label: 'Threads' },
].filter((s) => s.show)

export default function MegaFooter() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // GOLDEN_RULES 2.6 / NextSSR: 防止 hydration mismatch
  const isDark = mounted && resolvedTheme === 'dark'

  const navLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/music', label: 'Music' },
    { href: '/team', label: 'Team' },
  ]

  return (
    <footer
      className={cn(
        styles.footerRoot,
        'relative overflow-hidden',
        isDark ? 'bg-[#05080F] text-slate-200' : 'bg-slate-50 text-slate-900'
      )}
      aria-label="Footer"
      suppressHydrationWarning
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          isDark
            ? 'bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.08),transparent_42%)]'
            : 'bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_42%)]'
        )}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
        <motion.div
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className={cn(
              'mb-4 text-[10px] uppercase tracking-[0.32em]',
              isDark ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            Closing Note
          </p>
          <h2
            className={cn('max-w-5xl leading-[1.15] tracking-[0.08em]', isDark ? 'text-white' : 'text-slate-900')}
            style={{
              fontSize: 'clamp(2.75rem, 7vw, 7rem)',
              fontFamily: "'STXingkai', '华文行楷', 'STKaiti', '华文楷体', 'KaiTi', cursive",
            }}
          >
            远离颠倒梦想，
            <br />
            <span
              className={cn(
                isDark
                  ? 'bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-slate-900 via-indigo-700 to-slate-500 bg-clip-text text-transparent'
              )}
            >
              究竟涅槃。
            </span>
          </h2>
        </motion.div>

        <motion.div
          className={cn(styles.footerDivider, 'mb-12 sm:mb-14')}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.2 }}
          style={{ transformOrigin: 'center' }}
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="flex flex-col gap-4 text-center lg:text-left"
          >
            <p className={cn('text-[10px] uppercase tracking-[0.3em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Brand
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className={cn(
                  'inline-block text-2xl tracking-tight transition-colors duration-300',
                  isDark ? 'text-white hover:text-slate-200' : 'text-slate-900 hover:text-slate-700'
                )}
                style={{ fontFamily: 'var(--font-great-vibes)' }}
              >
                {siteMetadata.author}
              </Link>
              <p className={cn('max-w-md text-sm leading-6', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Research, essays, and carefully composed digital work across engineering, music, and visual thought.
              </p>
            </div>
          </motion.section>

          <motion.nav
            aria-label="Footer navigation"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="flex flex-col gap-4 text-center lg:text-left"
          >
            <p className={cn('text-[10px] uppercase tracking-[0.3em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Navigate
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    styles.footerLink,
                    'text-sm transition-colors duration-300',
                    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.nav>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="flex flex-col gap-4 text-center lg:text-left"
          >
            <p className={cn('text-[10px] uppercase tracking-[0.3em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Connect
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {socialLinks.map(({ key, href, Icon, label }) => (
                <a
                  key={key}
                  href={href!}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    styles.footerSocialButton,
                    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  )}
                  aria-label={label}
                  title={label}
                >
                  <span className="sr-only">{label}</span>
                  <span className={styles.footerSocialIcon}><Icon /></span>
                </a>
              ))}
            </div>
            {siteMetadata.email && (
              <a
                href={`mailto:${siteMetadata.email}`}
                className={cn(
                  styles.footerLink,
                  'mt-2 inline-flex justify-center text-sm transition-colors duration-300 lg:justify-start',
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {siteMetadata.email}
              </a>
            )}
          </motion.section>
        </div>

        <motion.div
          className={cn(styles.footerDivider, 'mt-12 sm:mt-14')}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.65, duration: 0.7 }}
        />

        <motion.div
          className="mt-6 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.75, duration: 0.7 }}
        >
          <div className="flex flex-col gap-2">
            <span className={cn('text-xs uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
              © {new Date().getFullYear()} Zhengbi Yong. All rights reserved.
            </span>
            <span className={cn('text-xs', isDark ? 'text-slate-600' : 'text-slate-500')}>
              Designed for a quieter, more deliberate reading experience.
            </span>
          </div>
          <Link
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              styles.footerLink,
              'text-[10px] uppercase tracking-[0.18em] transition-colors duration-300',
              isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            京ICP备2025110798号-1
          </Link>
        </motion.div>
      </div>
    </footer>
  )
}
