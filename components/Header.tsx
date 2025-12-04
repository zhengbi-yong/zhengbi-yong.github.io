'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { SunMedium, Moon, Download } from 'lucide-react'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from './Logo'
import Button from './ui/Button'
import Link from './Link'
import { cn } from './lib/utils'
import styles from './Header.module.css'

/**
 * Header - 页头组件
 * 基于提供的 Astro Header 组件转换而来
 * 包含 Logo、导航菜单、深色模式切换、Resume 按钮等功能
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

  // 处理 Resume 按钮点击
  const handleResumeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // TODO: 替换为实际的 Resume PDF 文件路径
    // 例如: window.open('/resume.pdf', '_blank')
    console.log('Resume button clicked')
  }, [])

  return (
    <>
      {/* This is an invisible div with relative position so that it takes up the height of the menu (because menu is absolute/fixed) */}
      <div className="relative w-full h-16 sm:h-20 opacity-0 pointer-events-none" />

      <header
        id="header"
        className={cn(
          styles.header,
          'fixed top-2 sm:top-4 z-50 w-full px-3 sm:px-4 lg:px-6'
        )}
      >
        <div
          id="site-container"
          className="flex items-center justify-between h-14 sm:h-15 container mx-auto px-4 sm:px-6 py-2.5 border-transparent border-[0.5px] transition-all duration-300"
        >
          {/* Logo */}
          <div className="flex-shrink-0 z-50">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
          </div>

          {/* Mobile Menu Background Overlay */}
          <div
            id="mobileMenuBackground"
            className={cn(
              styles.mobileMenuBackground,
              'fixed inset-0 z-20 w-screen h-screen duration-300 ease-out bg-white/90 backdrop-blur-sm dark:bg-neutral-950/90',
              isMobileMenuOpen ? 'block' : 'hidden'
            )}
            onClick={closeMobileMenu}
          />

          {/* Navigation */}
          <nav
            className={cn(
              styles.nav,
              'relative z-30 flex flex-row-reverse justify-start w-full text-sm sm:justify-end text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center'
            )}
          >
            {/* Mobile Menu Toggle Buttons */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Dark Mode Toggle (Mobile) */}
              <div
                id="darkToggleMobile"
                className={cn(
                  styles.darkToggleMobile,
                  styles.tapHighlight,
                  'flex items-center justify-center w-10 h-10 cursor-pointer rounded-full bg-gradient-to-b from-white to-[#edeefa] border-[0.5px] border-[#f3f3ff] dark:from-neutral-800 dark:to-neutral-600 dark:border-neutral-600 transition-transform duration-200 active:scale-95'
                )}
                onClick={toggleTheme}
              >
                <div
                  className={cn(
                    styles.darkToggleIcon,
                    'flex justify-center items-center w-6 h-6 relative overflow-hidden rounded-full bg-[#7fa1ff] bg-gradient-to-b from-[#85a6ff] to-[#2d6dc3] border-[0.5px] border-[#7fa1ff]'
                  )}
                >
                  {mounted && (
                    <>
                      <SunMedium
                        className={cn(
                          'absolute text-white w-4 h-4 transition duration-200 transform ease',
                          isDark ? 'hidden' : 'block'
                        )}
                      />
                      <Moon
                        className={cn(
                          'absolute text-white w-4 h-4 transition duration-200 transform ease',
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
                className={cn(
                  styles.tapHighlight,
                  'flex items-center justify-center w-10 h-10 cursor-pointer transition-transform duration-200 active:scale-90',
                  isMobileMenuOpen ? 'hidden' : 'flex'
                )}
                onClick={openMobileMenu}
              >
                <svg
                  className="w-7 h-7 text-neutral-700 dark:text-neutral-200"
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
                className={cn(
                  styles.tapHighlight,
                  'items-center justify-center w-10 h-10 cursor-pointer transition-transform duration-200 active:scale-90',
                  isMobileMenuOpen ? 'flex' : 'hidden'
                )}
                onClick={closeMobileMenu}
              >
                <svg
                  className="w-6 h-6 text-neutral-600 dark:text-neutral-200"
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

            {/* Menu Items */}
            <div
              id="menu"
              className={cn(
                styles.menu,
                'fixed top-[68px] sm:top-0 left-3 right-3 sm:left-0 sm:right-0 ease-out duration-300 z-40 flex-col items-center justify-start w-auto h-auto text-sm pt-6 pb-5 sm:py-0 sm:relative sm:flex-row sm:flex',
                isMobileMenuOpen ? 'flex' : 'hidden sm:flex'
              )}
            >
              {/* Mobile Menu Background */}
              <div className="absolute inset-0 top-0 right-0 block w-full h-full sm:hidden">
                <div
                  className={cn(
                    styles.menuBackground,
                    'relative w-full h-full bg-white/95 border border-dashed border-neutral-300 dark:border-neutral-700 backdrop-blur-md rounded-2xl dark:bg-neutral-950/95 shadow-lg'
                  )}
                />
              </div>

              {/* Menu Links */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center w-full sm:w-auto gap-1 sm:gap-0">
                {menuItems.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className="relative flex items-center justify-center w-full sm:w-auto px-5 py-2.5 sm:py-2 sm:px-3 md:px-4 font-medium tracking-wide text-center duration-200 ease-out rounded-lg sm:rounded-none text-neutral-700 dark:text-neutral-200 hover:text-primary sm:hover:bg-transparent dark:hover:text-white dark:hover:bg-neutral-800/50 sm:dark:hover:bg-transparent active:scale-[0.98] sm:active:scale-100 transition-all"
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

              {/* Contact Button (Mobile) */}
              <div className="relative z-10 w-full px-5 mt-3 sm:hidden">
                <Button
                  url="#"
                  type="fill"
                  className="m-auto w-full justify-center"
                  onClick={handleResumeClick}
                >
                  Resume <Download size={16} />
                </Button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="relative hidden sm:flex items-center gap-2 ml-4 lg:ml-6">
              {/* Contact Button (Desktop) */}
              <Button
                url="#"
                type="fill"
                className="md:flex mx-1"
                onClick={handleResumeClick}
              >
                Resume <Download size={16} />
              </Button>

              <span className="separator-line hidden sm:inline-block bg-[rgba(183,202,255,0.5)] mt-[20px] -translate-y-1/2 w-px h-[20px]" />

              {/* Dark Mode Toggle (Desktop) */}
              <div
                id="darkToggle"
                className={cn(
                  styles.darkToggle,
                  styles.tapHighlight,
                  'relative flex items-center h-9 px-2 gap-1.5 font-medium cursor-pointer rounded-full bg-gradient-to-b from-white to-[#edf1fa] border-[0.5px] border-[#f3f5ff] dark:from-neutral-800 dark:to-neutral-600 dark:border-neutral-600 transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 mx-1'
                )}
                onClick={toggleTheme}
              >
                <div
                  className={cn(
                    styles.darkToggleIcon,
                    'flex justify-center items-center flex-shrink-0 w-6 h-6 relative overflow-hidden rounded-full bg-gradient-to-b from-[#85a6ff] to-[#2d6dc3] border-[0.5px] border-[#7fa1ff]'
                  )}
                >
                  {mounted && (
                    <>
                      <SunMedium
                        id="sun"
                        className={cn(
                          'absolute text-white w-4 h-4 transition duration-200 transform ease',
                          isDark ? 'hidden' : 'block'
                        )}
                      />
                      <Moon
                        id="moon"
                        className={cn(
                          'absolute text-white w-4 h-4 transition duration-200 transform ease',
                          isDark ? 'block' : 'hidden'
                        )}
                      />
                    </>
                  )}
                </div>
                <span className="hidden sm:inline-block whitespace-nowrap">
                  <span
                    id="dayText"
                    className={cn(
                      'flex-shrink-0 text-sm text-left text-[#6f6c8f] dark:text-neutral-400',
                      isDark ? 'hidden' : 'block'
                    )}
                  >
                    Light
                  </span>
                  <span
                    id="nightText"
                    className={cn(
                      'flex-shrink-0 text-sm text-left text-[#6f6c8f] dark:text-neutral-400',
                      isDark ? 'block' : 'hidden'
                    )}
                  >
                    Dark
                  </span>
                </span>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
