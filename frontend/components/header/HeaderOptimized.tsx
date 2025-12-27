'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTheme } from 'next-themes'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '../Logo'
import Link from '../Link'
import SearchButton from '../SearchButton'
import { AuthButton } from '@/components/auth/AuthButton'
import { cn } from '../lib/utils'
import styles from '../Header.module.css'
import { DarkModeToggle } from './DarkModeToggle'
import { MobileMenuButton } from './MobileMenuButton'

/**
 * 合并的状态接口
 */
interface HeaderState {
  mounted: boolean
  isMobileMenuOpen: boolean
  scrollY: number
  isVisible: boolean
}

/**
 * 优化后的 Header 组件
 * 性能提升：
 * 1. 合并相关状态为单个对象
 * 2. 使用 useMemo 缓存计算值
 * 3. 分离静态子组件
 * 4. 节流 resize 监听器
 * 5. 滚动时逐渐隐藏header
 */
export default function Header() {
  const [state, setState] = useState<HeaderState>({
    mounted: false,
    isMobileMenuOpen: false,
    scrollY: 0,
    isVisible: true,
  })
  const { theme, setTheme, resolvedTheme } = useTheme()
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollYRef = useRef(0)

  // 当组件挂载后，显示 UI
  useEffect(() => {
    setState((prev) => ({ ...prev, mounted: true }))
  }, [])

  // 监听滚动，实现header逐渐隐藏效果
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollYRef.current ? 'down' : 'up'

      // 向下滚动时，根据滚动位置逐渐隐藏header
      // 向上滚动时，显示header
      let isVisible = true
      let transformY = 0

      if (scrollDirection === 'down' && currentScrollY > 100) {
        // 向下滚动超过100px后开始隐藏，最大隐藏到-100%
        const hideProgress = Math.min((currentScrollY - 100) / 200, 1) // 200px内完成隐藏
        transformY = hideProgress * -100
        isVisible = hideProgress < 1
      } else {
        // 向上滚动时显示
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

    // 节流滚动事件
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

  // 使用 useMemo 缓存深色模式状态
  const isDark = useMemo(() => {
    return resolvedTheme === 'dark'
  }, [resolvedTheme])

  // 过滤掉首页链接（使用 useMemo 缓存）
  const menuItems = useMemo(() => {
    return headerNavLinks.filter((link) => link.href !== '/')
  }, [])

  // 打开移动端菜单
  const openMobileMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileMenuOpen: true }))
    document.body.style.overflow = 'hidden'
  }, [])

  // 关闭移动端菜单
  const closeMobileMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileMenuOpen: false }))
    document.body.style.overflow = ''
  }, [])

  // 切换深色模式
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  // 处理窗口大小变化（添加节流优化）
  useEffect(() => {
    const handleResize = () => {
      // 清除之前的定时器
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // 节流：150ms 后执行
      resizeTimeoutRef.current = setTimeout(() => {
        if (window.innerWidth >= 640) {
          document.body.style.overflow = ''
          setState((prev) => ({ ...prev, isMobileMenuOpen: false }))
        }
      }, 150)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  // 处理键盘事件（用于可访问性）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        action()
      }
    },
    []
  )

  // 使用 useMemo 缓存 Logo 部分
  const logoSection = useMemo(
    () => (
      <div className="z-50 ml-3 flex-shrink-0 justify-self-start sm:ml-0 sm:justify-self-center">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
      </div>
    ),
    []
  )

  // 使用 useMemo 缓存移动端操作按钮部分
  const mobileActionsSection = useMemo(
    () => (
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
        <DarkModeToggle
          isDark={isDark}
          mounted={state.mounted}
          onToggle={toggleTheme}
          variant="mobile"
          onKeyDown={handleKeyDown}
        />

        {/* Mobile Menu Buttons */}
        <MobileMenuButton
          isOpen={state.isMobileMenuOpen}
          onOpen={openMobileMenu}
          onClose={closeMobileMenu}
          onKeyDown={handleKeyDown}
        />
      </div>
    ),
    [isDark, state.mounted, state.isMobileMenuOpen, toggleTheme, handleKeyDown, openMobileMenu, closeMobileMenu]
  )

  // 使用 useMemo 缓存桌面端操作按钮部分
  const desktopActionsSection = useMemo(
    () => (
      <div className="relative mr-2 hidden items-center gap-3 justify-self-end sm:mr-3 sm:flex lg:mr-4">
        {/* Search Button */}
        <SearchButton />

        {/* Dark Mode Toggle (Desktop) */}
        <DarkModeToggle
          isDark={isDark}
          mounted={state.mounted}
          onToggle={toggleTheme}
          variant="desktop"
          onKeyDown={handleKeyDown}
        />

        {/* Auth Button */}
        <AuthButton />
      </div>
    ),
    [isDark, state.mounted, toggleTheme, handleKeyDown]
  )

  return (
    <>
      {/* This is an invisible div with relative position so that it takes up the height of the menu */}
      <div className="pointer-events-none relative h-16 w-full opacity-0 sm:h-20" />

      <header
        id="header"
        style={{
          transform: state.transformY ? `translateY(${state.transformY}%)` : undefined,
          transition: 'transform 0.3s ease-out',
        }}
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
            role="button"
            tabIndex={0}
            className={cn(
              styles.mobileMenuBackground,
              'fixed inset-0 z-20 h-screen w-screen bg-white/90 backdrop-blur-sm duration-300 ease-out dark:bg-neutral-950/90',
              state.isMobileMenuOpen ? 'block' : 'hidden'
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
                state.isMobileMenuOpen ? 'flex' : 'hidden sm:flex'
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

          {/* Logo Section (Memoized) */}
          {logoSection}

          {/* Mobile Actions (Memoized) */}
          {mobileActionsSection}

          {/* Desktop Actions (Memoized) */}
          {desktopActionsSection}
        </div>
      </header>
    </>
  )
}
