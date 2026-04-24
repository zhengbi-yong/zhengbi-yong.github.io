'use client'

/**
 * PWA安装提示组件
 *
 * 功能：
 * - 检测PWA安装条件
 * - 显示安装横幅
 * - 记录安装统计
 */

import { useState, useEffect } from 'react'
// iOS detection for installation prompts
const _isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
import { X, Download, Globe } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // 检测PWA是否已安装
  useEffect(() => {
  // iOS Safari 检测
    const isInStandaloneMode = (window as any).navigator.standalone === true

    // 其他浏览器检测
    const isInstalled = isInStandaloneMode || window.matchMedia('(display-mode: standalone)').matches

    setIsInstalled(isInstalled)

    if (isInstalled) {
      // 记录安装统计
      recordInstallEvent('already_installed')
    }
  }, [])

  // 监听 beforeinstallprompt 事件
  useEffect(() => {
    const handler = (e: Event) => {
      // 阻止默认的安装横幅
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent

      // 保存事件以备后用
      setDeferredPrompt(promptEvent)

      // 检查是否已显示过提示（使用 sessionStorage，单会话有效）
      // ultradesign §3.3/GOLDEN_RULES §9.2: localStorage 禁止用于非必要数据
      const hasShownPrompt = sessionStorage.getItem('pwa_install_prompt_shown')
      const lastShown = hasShownPrompt ? parseInt(hasShownPrompt) : 0
      const daysSinceShown = (Date.now() - lastShown) / (1000 * 60 * 60 * 24)

      // 如果超过7天未显示，或者是第一次，显示提示
      if (daysSinceShown > 7 || !hasShownPrompt) {
        setShowPrompt(true)
        recordInstallEvent('prompt_shown')
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    // 显示安装提示
    deferredPrompt.prompt()

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      recordInstallEvent('installed')
      setIsInstalled(true)
    } else {
      recordInstallEvent('dismissed')
    }

    // 清除保存的事件
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)

    // 记录已显示提示的时间（使用 sessionStorage）
    sessionStorage.setItem('pwa_install_prompt_shown', Date.now().toString())

    recordInstallEvent('dismissed_by_user')
  }

  // 记录安装事件到后端（可选）
  const recordInstallEvent = async (event: string) => {
    try {
      await fetch('/api/analytics/pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to record PWA event:', error)
    }
  }

  // 如果已安装或已关闭，不显示提示
  if (isInstalled || dismissed || !showPrompt) {
    return null
  }

// iOS Safari 需要手动添加到主屏幕的提示

  if (_isIOS) {
    return <IOSInstallPrompt onDismiss={handleDismiss} />
  }

  // 其他浏览器的安装提示
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 图标和标题 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              安装应用
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              安装我们的应用到主屏幕，享受更快的访问速度和离线阅读体验！
            </p>

            {/* 特性列表 */}
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                快速启动，就像原生应用
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                离线阅读文章
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                接收新文章通知
              </li>
            </ul>

            {/* 安装按钮 */}
            <button
              onClick={handleInstall}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              立即安装
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// iOS Safari 安装提示组件
function IOSInstallPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
        {/* 关闭按钮 */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 图标和标题 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              安装应用
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              在 Safari 中安装此应用：
            </p>

            {/* 步骤说明 */}
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 list-decimal list-inside">
              <li>点击底部的<span className="font-semibold"> 分享 </span>按钮</li>
              <li>向下滚动，点击<span className="font-semibold"> 添加到主屏幕 </span></li>
              <li>点击<span className="font-semibold"> 添加 </span>按钮</li>
            </ol>

            {/* 演示图 */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Globe className="h-8 w-8 mx-auto mb-2" />
                点击分享图标 → 添加到主屏幕
              </div>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={onDismiss}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
