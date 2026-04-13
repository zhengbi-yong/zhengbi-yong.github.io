'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import siteMetadata from '@/data/siteMetadata'

interface SocialLink {
  name: string
  href: string
  icon: React.ReactNode
}

export interface GeistFooterProps {
  className?: string
}

export function GeistFooter({ className }: GeistFooterProps) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const socialLinks: SocialLink[] = [
    {
      name: 'GitHub',
      href: siteMetadata.github || '#',
      icon: <Github className="h-4 w-4" />,
    },
    {
      name: 'Twitter',
      href: siteMetadata.twitter || '#',
      icon: <Twitter className="h-4 w-4" />,
    },
    {
      name: 'LinkedIn',
      href: siteMetadata.linkedin || '#',
      icon: <Linkedin className="h-4 w-4" />,
    },
    {
      name: 'Email',
      href: `mailto:${siteMetadata.email}`,
      icon: <Mail className="h-4 w-4" />,
    },
  ]

  const footerNav = [
    { title: 'Blog', href: '/blog' },
    { title: 'Projects', href: '/projects' },
    { title: 'Team', href: '/team' },
    { title: 'Music', href: '/music' },
    { title: 'About', href: '/about' },
    { title: 'Search', href: '/search' },
  ]

  return (
    <footer
      className={cn(
        'w-full border-t border-[var(--geist-border)] px-6 py-12',
        'bg-[var(--geist-footer-bg)]',
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link
              href="/"
              className={cn(
                'font-geist-sans text-lg font-semibold tracking-tight',
                'text-[var(--geist-fg)] transition-opacity hover:opacity-70'
              )}
            >
              {siteMetadata.title}
            </Link>
            <p className="font-geist-sans text-xs text-[var(--geist-fg-secondary)]">
              © {currentYear} {siteMetadata.author}. All rights reserved.
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-geist-sans text-sm',
                  'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]',
                  'transition-colors duration-150'
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]',
                  'transition-all duration-150 hover:bg-[var(--geist-muted)]'
                )}
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* ICP Filing */}
        <div className="mt-8 border-t border-[var(--geist-border)] pt-8 text-center">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'font-geist-sans text-xs',
              'text-[var(--geist-fg-tertiary)] hover:text-[var(--geist-fg-secondary)]',
              'transition-colors duration-150'
            )}
          >
            京ICP备2025110798号-1
          </a>
        </div>
      </div>
    </footer>
  )
}
