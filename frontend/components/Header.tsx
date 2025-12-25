'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { SunMedium, Moon } from 'lucide-react'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from './Logo'
import Link from './Link'
import SearchButton from './SearchButton'
import { AuthButton } from '@/components/auth/AuthButton'
import { cn } from './lib/utils'
import styles from './Header.module.css'

/**
 * Header - 页头组件
 * 基于提供的 Astro Header 组件转换而来
 * 包含 Logo、导航菜单、深色模式切换、登录按钮等功能
 */
export default function Header() {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // 当组件挂载后，显示 UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // 同步深色模式图标
  const isDark = resolvedTheme === 'dark'

  // 打开移动端菜单
  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true)
    document.body.style.overflow = 'hidden' // 防止背景滚动
  }, [])

  // 关闭移动端菜单
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
    document.body.style.overflow = '' // 恢复滚动
  }, [])

  // 切换深色模式
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        // 如果从移动端调整到桌面端，确保菜单状态正确
        document.body.style.overflow = ''
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 过滤掉首页链接（通常不需要在导航中显示）
  const menuItems = headerNavLinks.filter((link) => link.href !== '/')

  // 处理键盘事件（用于可访问性）
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }, [])

  return (
    <>
      {/* This is an invisible div with relative position so that it takes up the height of the menu (because menu is absolute/fixed) */}
      <div className="pointer-events-none relative h-16 w-full opacity-0 sm:h-20" />

      <header
        id="header"
        className={cn(
          styles.header,
          'fixed top-2 left-0 z-50 w-full px-4 pl-[calc(100vw-100%)] sm:top-4 sm:px-6 lg:px-8'
        )}
      >
        <div
          id="site-container"
          className="grid h-14 w-full grid-cols-[auto_1fr_auto] items-center rounded-2xl border-[0.5px] border-white/20 bg-white/30 py-2.5 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-300 sm:h-15 sm:grid-cols-3 dark:border-white/10 dark:bg-neutral-950/30 dark:shadow-black/20"
        >
          {/* Mobile Menu Background Overlay */}
          <div
            id="mobileMenuBackground"
            role="button"
            tabIndex={0}
            className={cn(
              styles.mobileMenuBackground,
              'fixed inset-0 z-20 h-screen w-screen bg-white/90 backdrop-blur-sm duration-300 ease-out dark:bg-neutral-950/90',
              isMobileMenuOpen ? 'block' : 'hidden'
            )}
            onClick={closeMobileMenu}
            onKeyDown={(e) => handleKeyDown(e, closeMobileMenu)}
            aria-label="关闭菜单"
          />

          {/* Navigation */}
          <nav
            className={cn(
              styles.nav,
              'relative z-30 flex w-full justify-start text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-self-start dark:text-neutral-400'
            )}
          >
            {/* Menu Items */}
            <div
              id="menu"
              className={cn(
                styles.menu,
                'fixed top-[68px] right-3 left-3 z-40 h-auto w-auto flex-col items-center justify-start pt-6 pb-5 text-sm duration-300 ease-out sm:relative sm:top-0 sm:right-0 sm:left-0 sm:flex sm:flex-row sm:py-0',
                isMobileMenuOpen ? 'flex' : 'hidden sm:flex'
              )}
            >
              {/* Mobile Menu Background */}
              <div className="absolute inset-0 top-0 right-0 block h-full w-full sm:hidden">
                <div
                  className={cn(
                    styles.menuBackground,
                    'relative h-full w-full rounded-2xl border border-dashed border-neutral-300 bg-white/95 shadow-lg backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-950/95'
                  )}
                />
              </div>

              {/* Menu Links */}
              <div className="relative z-10 flex w-full flex-col items-center gap-1 sm:w-auto sm:flex-row sm:gap-0">
                {menuItems.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className="hover:text-primary relative flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-center font-medium tracking-wide text-neutral-700 transition-all duration-200 ease-out active:scale-[0.98] sm:w-auto sm:rounded-none sm:px-3 sm:py-2 sm:hover:bg-transparent sm:active:scale-100 md:px-4 dark:text-neutral-200 dark:hover:bg-neutral-800/50 dark:hover:text-white sm:dark:hover:bg-transparent"
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        closeMobileMenu()
                      }
                    }}
                  >
                    {menu.title}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Logo */}
          <div className="z-50 ml-3 flex-shrink-0 justify-self-start sm:ml-0 sm:justify-self-center">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
          </div>

          {/* Mobile Menu Toggle Buttons */}
          <div className="mr-1 flex items-center gap-2 justify-self-end sm:hidden">
            {/* Search Button (Mobile) */}
            <div
              className={cn(
                'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-white/30 bg-white/40 backdrop-blur-sm transition-all duration-200 hover:bg-white/50 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50'
              )}
            >
              <SearchButton />
            </div>

            {/* Dark Mode Toggle (Mobile) */}
            <div
              id="darkToggleMobile"
              role="button"
              tabIndex={0}
              className={cn(
                styles.darkToggleMobile,
                styles.tapHighlight,
                'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-white/30 bg-white/40 backdrop-blur-sm transition-all duration-200 hover:bg-white/50 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50'
              )}
              onClick={toggleTheme}
              onKeyDown={(e) => handleKeyDown(e, toggleTheme)}
              aria-label="切换深色模式"
              title={mounted ? (isDark ? 'Dark' : 'Light') : '切换深色模式'}
            >
              <div
                className={cn(
                  'relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-lg bg-neutral-600 dark:bg-neutral-400'
                )}
              >
                {mounted && (
                  <>
                    <SunMedium
                      className={cn(
                        'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                        isDark ? 'hidden' : 'block'
                      )}
                    />
                    <Moon
                      className={cn(
                        'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                        isDark ? 'block' : 'hidden'
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Hamburger Menu Button */}
            <div
              id="openMenu"
              role="button"
              tabIndex={0}
              className={cn(
                styles.tapHighlight,
                'flex h-10 w-10 cursor-pointer items-center justify-center transition-transform duration-200 active:scale-90',
                isMobileMenuOpen ? 'hidden' : 'flex'
              )}
              onClick={openMobileMenu}
              onKeyDown={(e) => handleKeyDown(e, openMobileMenu)}
              aria-label="打开菜单"
            >
              <svg
                className="h-7 w-7 text-neutral-700 dark:text-neutral-200"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 8h16M4 16h16" />
              </svg>
            </div>

            {/* Close Menu Button */}
            <div
              id="closeMenu"
              role="button"
              tabIndex={0}
              className={cn(
                styles.tapHighlight,
                'h-10 w-10 cursor-pointer items-center justify-center transition-transform duration-200 active:scale-90',
                isMobileMenuOpen ? 'flex' : 'hidden'
              )}
              onClick={closeMobileMenu}
              onKeyDown={(e) => handleKeyDown(e, closeMobileMenu)}
              aria-label="关闭菜单"
            >
              <svg
                className="h-6 w-6 text-neutral-600 dark:text-neutral-200"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="relative mr-2 hidden items-center gap-3 justify-self-end sm:mr-3 sm:flex lg:mr-4">
            {/* Search Button */}
            <SearchButton />

            {/* Dark Mode Toggle (Desktop) */}
            <div
              id="darkToggle"
              role="button"
              tabIndex={0}
              className={cn(
                styles.darkToggle,
                styles.tapHighlight,
                'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-white/30 bg-white/40 backdrop-blur-sm transition-all duration-200 hover:bg-white/50 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50'
              )}
              onClick={toggleTheme}
              onKeyDown={(e) => handleKeyDown(e, toggleTheme)}
              aria-label="切换深色模式"
              title={mounted ? (isDark ? 'Dark' : 'Light') : '切换深色模式'}
            >
              <div
                className={cn(
                  'relative flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-600 dark:bg-neutral-400'
                )}
              >
                {mounted && (
                  <>
                    <SunMedium
                      id="sun"
                      className={cn(
                        'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                        isDark ? 'hidden' : 'block'
                      )}
                    />
                    <Moon
                      id="moon"
                      className={cn(
                        'ease absolute h-3.5 w-3.5 transform text-white transition duration-200',
                        isDark ? 'block' : 'hidden'
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Auth Button - 登录/注册/用户信息 */}
            <AuthButton />
          </div>
        </div>
      </header>
    </>
  )
}
