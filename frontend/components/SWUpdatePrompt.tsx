'use client'

/**
 * Service Worker 更新提示组件
 *
 * 当有新版本可用时显示更新提示
 */

import { useState, useEffect } from 'react'
import { X, RefreshCw, Download } from 'lucide-react'

interface UpdateMessage {
  type: 'SW_UPDATED'
  version: string
}

export function SWUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newVersion, setNewVersion] = useState('')

  useEffect(() => {
    // 监听来自 Service Worker 的消息
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as UpdateMessage

      if (message && message.type === 'SW_UPDATED') {
        setNewVersion(message.version)
        setShowUpdate(true)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)

    // 告诉 Service Worker 跳过等待
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration) {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    // 刷新页面以应用更新
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-green-200 dark:border-green-800 p-6">
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
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              新版本可用
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              版本 {newVersion} 已准备就绪，包含性能改进和新功能。
            </p>

            {/* 更新按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    立即更新
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                稍后提醒
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
