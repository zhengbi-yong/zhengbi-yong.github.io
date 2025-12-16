'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Button } from '../ui/ButtonSimple'
import { cn } from '@/lib/utils'

interface HeaderNavigationProps {
  className?: string
  navLinks?: Array<{ href: string; title: string }>
}

export function HeaderNavigation({ className, navLinks = [] }: HeaderNavigationProps) {
  const { t } = useTranslation('common')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 使用 useMemo 缓存过滤后的导航项，避免不必要的重计算
  const navigation = useMemo(() => {
    const defaultNav = [
      { name: t('nav.home'), href: '/' },
      { name: t('nav.blog'), href: '/blog' },
      { name: t('nav.tags'), href: '/tags' },
      { name: t('nav.projects'), href: '/projects' },
      { name: t('nav.about'), href: '/about' },
    ]

    // 如果传入了自定义导航链接，则使用它们；否则使用默认导航
    if (navLinks.length > 0) {
      return navLinks
        .filter((link) => link.href !== '/') // 过滤掉首页链接
        .map((link) => ({
          name: link.title,
          href: link.href,
        }))
    }

    return defaultNav
  }, [t, navLinks])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className={cn('flex items-center space-x-8', className)}>
      {/* Desktop Navigation */}
      <div className="hidden space-x-8 md:flex">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="rounded text-gray-600 transition-colors hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          aria-label={t('nav.toggleMenu')}
          aria-expanded={mobileMenuOpen}
          className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-t border-gray-200 bg-white md:hidden dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
