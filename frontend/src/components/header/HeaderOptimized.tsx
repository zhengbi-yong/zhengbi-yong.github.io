
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
  transformY?: number
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
    if (!state.mounted) return true // SSR default to avoid hydration mismatch
    return resolvedTheme === 'dark'
  }, [state.mounted, resolvedTheme])

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
      'inline-flex items-center border-b pb-1 text-sm font-medium tracking-[0.08em] transition-all duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
      isActive
        ? isDark
          ? 'border-white/70 text-white'
          : 'border-zinc-900 text-zinc-950'
        : isDark
          ? 'border-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-100'
          : 'border-transparent text-zinc-500 hover:border-black/10 hover:text-zinc-900'
    )
  }

  const actionButtonClass = cn(
    'inline-flex h-10 w-10 items-center justify-center rounded-full border text-current transition-all duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97]',
    isDark
      ? 'border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.08]'
      : 'border-black/8 bg-white/75 hover:border-black/12 hover:bg-black/[0.04]'
  )

  const actionIconClass = 'h-[18px] w-[18px]'

  return (
    <>
      <div className="pointer-events-none relative h-[var(--header-height)] w-full opacity-0" />

      <header
        id="header"
        style={{
          transform: state.transformY ? `translateY(${state.transformY}%)` : undefined,
          transition: 'transform var(--motion-slow) var(--ease-standard)',
        }}
        className={cn(
          styles.header,
          'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl',
          isDark
            ? 'border-[var(--border-subtle)] bg-[var(--shell-elevated)] text-zinc-100 shadow-[var(--shadow-soft)]'
            : 'border-[var(--border-subtle)] bg-[var(--shell-elevated)] text-zinc-700 shadow-[var(--shadow-soft)]'
        )}
      >
        <div className="container-shell flex min-h-[var(--header-height)] items-center justify-between gap-6 py-3">
          <Link
            href="/"
            className={cn(
              'shrink-0 text-[15px] font-semibold tracking-[-0.02em] transition-colors duration-[var(--motion-fast)] md:text-base',
              isDark ? 'text-zinc-100 hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'
            )}
          >
            {siteMetadata.author}
          </Link>

          <div className="hidden min-w-0 items-center justify-end gap-6 md:flex lg:gap-8">
            <nav className="flex items-center gap-5 lg:gap-7">
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

            <div
              className={cn(
                'flex items-center gap-2.5 border-l pl-5',
                isDark ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'
              )}
            >
              <Link
                href="/search"
                className={actionButtonClass}
                aria-label="搜索"
              >
                <Search className={actionIconClass} />
              </Link>

              <button
                onClick={toggleTheme}
                className={actionButtonClass}
                aria-label="切换主题"
              >
                {state.mounted
                  ? isDark
                    ? <Sun className={actionIconClass} />
                    : <Moon className={actionIconClass} />
                  : <span className="block h-[18px] w-[18px]" />}
              </button>

              <AuthButton isDark={isDark} />
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-3 md:hidden',
              isDark ? 'text-zinc-300' : 'text-zinc-600'
            )}
          >
            <Link
              href="/search"
              className={actionButtonClass}
              aria-label="搜索"
            >
              <Search className={actionIconClass} />
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

        {state.isMobileMenuOpen && (
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'fixed inset-0 z-20 h-screen w-screen backdrop-blur-sm md:hidden',
              isDark ? 'bg-[#05080F]/78' : 'bg-zinc-50/78'
            )}
            onClick={closeMobileMenu}
            onKeyDown={(e) => handleKeyDown(e, closeMobileMenu)}
            aria-label="关闭菜单"
          />
        )}

        <div
          id="menu"
          className={cn(
            styles.menu,
            'fixed top-[calc(var(--header-height)-0.25rem)] right-3 left-3 z-40 h-auto w-auto flex-col items-center justify-start pt-4 pb-4 text-sm duration-[var(--motion-slow)] ease-[var(--ease-standard)] md:hidden',
            state.isMobileMenuOpen ? 'flex' : 'hidden'
          )}
        >
          <div
            className={cn(
              'absolute inset-0 top-0 right-0 block h-full w-full rounded-[var(--radius-panel)] border shadow-[var(--shadow-soft)] backdrop-blur-xl',
              isDark
                ? 'border-white/10 bg-[var(--surface-elevated)]'
                : 'border-black/8 bg-[var(--surface-elevated)]'
            )}
          />

          <div className="relative z-10 flex w-full flex-col items-center gap-1 px-2">
            {menuItems.map((menu) => {
              const isActive = currentPath.startsWith(menu.href)
              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={cn(
                    'relative flex min-h-11 w-full items-center justify-center rounded-2xl px-5 py-3 text-center font-inter text-sm uppercase tracking-[0.18rem] transition-all duration-[var(--motion-fast)] ease-[var(--ease-standard)] active:scale-[0.98]',
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-zinc-100 opacity-100'
                        : 'bg-black/5 text-zinc-900 opacity-100'
                      : isDark
                        ? 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                        : 'text-zinc-500 hover:bg-black/[0.03] hover:text-zinc-900'
                  )}
                  onClick={closeMobileMenu}
                >
                  {menu.title}
                </Link>
              )
            })}

            <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-4 dark:border-white/10">
              <button
                onClick={toggleTheme}
                className={actionButtonClass}
                aria-label="切换主题"
              >
                {state.mounted
                  ? isDark
                    ? <Sun className={actionIconClass} />
                    : <Moon className={actionIconClass} />
                  : <span className="block h-[18px] w-[18px]" />}
              </button>
              <AuthButton isDark={isDark} />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
