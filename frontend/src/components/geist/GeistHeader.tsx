'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeistThemeSwitcher } from './GeistThemeSwitcher'
import { GeistButton } from './GeistButton'
import siteMetadata from '@/data/siteMetadata'
import { useAuthStore } from '@/lib/store/auth-store'

function getAvatarUrl(profile: Record<string, unknown> | null): string | undefined {
  const value = profile?.avatar_url
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

interface NavItem {
  title: string
  href: string
}

const navItems: NavItem[] = [
  { title: 'Blog', href: '/blog' },
  { title: 'Projects', href: '/projects' },
  { title: 'Team', href: '/team' },
  { title: 'Music', href: '/music' },
  { title: 'About', href: '/about' },
]

export interface GeistHeaderProps {
  className?: string
}

export function GeistHeader({ className }: GeistHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  const avatarUrl = user ? getAvatarUrl(user.profile) : undefined
  const avatarFallback = user?.username?.trim().charAt(0).toUpperCase() || 'U'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50',
        'h-[var(--geist-header-height)]',
        'bg-[var(--geist-header-bg)] backdrop-blur-xl',
        'border-b border-[var(--geist-header-border)]',
        className
      )}
    >
      <div className="mx-auto h-full max-w-7xl px-6">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              'font-geist-sans text-xl font-semibold tracking-tight',
              'text-[var(--geist-fg)] transition-opacity hover:opacity-70'
            )}
          >
            {siteMetadata.title}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-geist-sans text-sm font-medium',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-[var(--geist-fg)]'
                      : 'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]'
                  )}
                >
                  {item.title}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Link
              href="/search"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]',
                'transition-all duration-150 hover:bg-[var(--geist-muted)]'
              )}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* Theme Switcher */}
            <GeistThemeSwitcher />

            {/* Auth Button */}
            {isAuthenticated && user ? (
              <Link
                href="/profile"
                className={cn(
                  'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full',
                  'border border-[var(--geist-border)] bg-[var(--geist-muted)]',
                  'transition-all duration-150 hover:opacity-80'
                )}
                aria-label="Profile"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-[var(--geist-fg)]">
                    {avatarFallback}
                  </span>
                )}
              </Link>
            ) : (
              <Link href="/login">
                <GeistButton variant="primary" size="sm">
                  Sign in
                </GeistButton>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg md:hidden',
                'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]',
                'transition-all duration-150 hover:bg-[var(--geist-muted)]'
              )}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 border-b border-[var(--geist-border)] bg-[var(--geist-bg)] md:hidden">
          <nav className="flex flex-col gap-2 px-6 py-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-geist-sans rounded-lg px-3 py-2 text-base font-medium',
                    'transition-colors duration-150',
                    isActive
                      ? 'bg-[var(--geist-muted)] text-[var(--geist-fg)]'
                      : 'text-[var(--geist-fg-secondary)] hover:bg-[var(--geist-muted)] hover:text-[var(--geist-fg)]'
                  )}
                >
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
