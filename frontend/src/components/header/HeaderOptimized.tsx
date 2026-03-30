// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Search, Sun, Moon } from 'lucide-react'
import headerNavLinks from '@/data/headerNavLinks'
import Link from '../Link'
import { AuthButton } from '@/components/auth/AuthButton'
import { cn } from '../lib/utils'
import styles from '../Header.module.css'
import { MobileMenuButton } from './MobileMenuButton'
import siteMetadata from '@/data/siteMetadata'

interface HeaderState {
  mounted: boolean
  isMobileMenuOpen: boolean
  scrollY: number
  isVisible: boolean
}

export default function Header() {
  const [state, setState] = useState<HeaderState>({
    mounted: false,
    isMobileMenuOpen: false,
    scrollY: 0,
    isVisible: true,
  })
  const [currentPath, setCurrentPath] = useState('')
  const { setTheme, resolvedTheme } = useTheme()
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    setState((prev) => ({ ...prev, mounted: true }))
    setCurrentPath(window.location.pathname)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollYRef.current ? 'down' : 'up'

      let isVisible = true
      let transformY = 0

      if (scrollDirection === 'down' && currentScrollY > 100) {
        const hideProgress = Math.min((currentScrollY - 100) / 200, 1)
        transformY = hideProgress * -100
        isVisible = hideProgress < 1
      } else {
        transformY = 0
        isVisible = true
      }

      setState((prev) => ({
        ...prev,
        scrollY: currentScrollY,
        isVisible,
        transformY,
      }))

      lastScrollYRef.current = currentScrollY
    }

    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => window.removeEventListener('scroll', throttledHandleScroll)
  }, [])

  const isDark = useMemo(() => {
    return resolvedTheme === 'dark'
  }, [resolvedTheme])

  const menuItems = useMemo(() => {
    return headerNavLinks.filter((link) => link.href !== '/')
  }, [])

  const openMobileMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileMenuOpen: true }))
    document.body.style.overflow = 'hidden'
  }, [])

  const closeMobileMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileMenuOpen: false }))
    document.body.style.overflow = ''
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        action()
      }
    },
    []
  )

  const getNavLinkClass = (isActive: boolean) => {
    return cn(
      'font-inter text-sm md:text-xs lg:text-sm uppercase tracking-[0.2rem] transition-all duration-300',
      isActive
        ? isDark
          ? 'text-[#c6c7c6] underline decoration-[1px] underline-offset-8 opacity-100'
          : 'text-gray-800 underline decoration-[1px] underline-offset-8 opacity-100'
        : isDark
          ? 'text-slate-400 hover:text-[#c6c7c6] opacity-80 hover:opacity-100'
          : 'text-gray-500 hover:text-gray-800 opacity-80 hover:opacity-100'
    )
  }

  return (
    <>
      {/* 占位 div - 保持页面布局一致 */}
      <div className="pointer-events-none relative h-20 w-full opacity-0" />

      {/* 艺术风格页眉 */}
      <header
        id="header"
        style={{
          transform: state.transformY ? `translateY(${state.transformY}%)` : undefined,
          transition: 'transform 0.3s ease-out',
        }}
        className={cn(
          styles.header,
          'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl shadow-[0px_60px_64px_-12px_rgba(0,0,0,0.04)]',
          isDark
            ? 'bg-[#05080F]/80 text-[#c6c7c6]'
            : 'bg-white/80 dark:bg-[#05080F]/80 text-gray-700 dark:text-[#c6c7c6]'
        )}
      >
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-6 md:py-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'font-newsreader italic text-xl md:text-2xl tracking-tighter transition-colors duration-300',
                isDark ? 'text-[#c6c7c6] hover:text-white' : 'text-gray-800 hover:text-gray-600'
              )}
            >
              {siteMetadata.title}
            </Link>

            {/* 桌面端导航 - 仅在 md+ 显示 */}
            <nav className="hidden md:flex items-center gap-10 lg:gap-14">
              {menuItems.map((menu) => {
                const isActive = currentPath.startsWith(menu.href)
                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={getNavLinkClass(isActive)}
                  >
                    {menu.title}
                  </Link>
                )
              })}
            </nav>

            {/* 桌面端操作按钮 - 仅在 md+ 显示 */}
            <div className={cn(
              'hidden md:flex items-center gap-8',
              isDark ? 'text-[#c6c7c6]' : 'text-gray-700'
            )}>
              <Link
                href="/search"
                className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-300"
                aria-label="搜索"
              >
                <Search className="w-5 h-5" />
              </Link>

              <button
                onClick={toggleTheme}
                className="flex items-center opacity-60 hover:opacity-100 transition-opacity duration-300"
                aria-label="切换主题"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <AuthButton isDark={isDark} />
            </div>

            {/* 移动端操作按钮 - 仅在 < md 显示 */}
            <div className={cn(
              'flex items-center gap-4 md:hidden',
              isDark ? 'text-[#c6c7c6]' : 'text-gray-700'
            )}>
              <Link
                href="/search"
                className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                aria-label="搜索"
              >
                <Search className="w-5 h-5" />
              </Link>

              <MobileMenuButton
                isOpen={state.isMobileMenuOpen}
                onOpen={openMobileMenu}
                onClose={closeMobileMenu}
                onKeyDown={handleKeyDown}
                isDark={isDark}
              />
            </div>
          </div>
        </div>

        {/* 移动端菜单遮罩 - 仅在 < md 显示 */}
        {state.isMobileMenuOpen && (
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'fixed inset-0 z-20 h-screen w-screen backdrop-blur-sm md:hidden',
              isDark ? 'bg-[#05080F]/95' : 'bg-white/95'
            )}
            onClick={closeMobileMenu}
            onKeyDown={(e) => handleKeyDown(e, closeMobileMenu)}
            aria-label="关闭菜单"
          />
        )}

        {/* 移动端菜单 - 仅在 < md 显示 */}
        <div
          id="menu"
          className={cn(
            styles.menu,
            'fixed top-[68px] right-3 left-3 z-40 h-auto w-auto flex-col items-center justify-start pt-6 pb-5 text-sm duration-300 ease-out md:hidden',
            state.isMobileMenuOpen ? 'flex' : 'hidden'
          )}
        >
          {/* 移动端菜单背景 */}
          <div className={cn(
            'absolute inset-0 top-0 right-0 block h-full w-full rounded-2xl border shadow-lg backdrop-blur-md',
            isDark
              ? 'border-white/10 bg-[#0a0e16]/95'
              : 'border-gray-200 bg-white/95'
          )} />

          {/* 移动端菜单链接 */}
          <div className="relative z-10 flex w-full flex-col items-center gap-1">
            {menuItems.map((menu) => {
              const isActive = currentPath.startsWith(menu.href)
              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={cn(
                    'relative flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-center font-inter text-sm uppercase tracking-[0.2rem] transition-all duration-200 ease-out active:scale-[0.98]',
                    isActive
                      ? isDark ? 'text-[#c6c7c6] opacity-100' : 'text-gray-800 opacity-100'
                      : isDark ? 'text-slate-400' : 'text-gray-500'
                  )}
                  onClick={closeMobileMenu}
                >
                  {menu.title}
                </Link>
              )
            })}

            {/* 移动端操作按钮 */}
            <div className="mt-4 flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                aria-label="切换主题"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <AuthButton isDark={isDark} />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
