/**
 * 离线页面
 *
 * 当用户离线时显示此页面
 */

'use client'

import { WiCloud } from 'react-icons/wi'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted dark:bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 图标 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary opacity-20 rounded-full animate-ping" />
            <div className="relative bg-[var(--theme-info-muted)] dark:bg-blue-900 p-6 rounded-full">
              <WiCloud className="h-16 w-16 text-primary dark:text-primary" />
            </div>
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
            您当前离线
          </h1>
          <p className="text-lg text-muted-foreground dark:text-muted-foreground">
            请检查您的网络连接后重试
          </p>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            部分内容可能仍可从缓存中访问
          </p>
        </div>

        {/* 缓存的文章列表 */}
        <div className="bg-background dark:bg-card rounded-lg shadow-lg p-6 text-left">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">
            缓存的文章
          </h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
            您之前访问过的文章可能仍可离线查看：
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/blog"
                className="text-primary dark:text-primary hover:underline flex items-center"
              >
                <span className="mr-2">→</span>
                文章列表
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-primary dark:text-primary hover:underline flex items-center"
              >
                <span className="mr-2">→</span>
                关于作者
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="text-primary dark:text-primary hover:underline flex items-center"
              >
                <span className="mr-2">→</span>
                项目展示
              </Link>
            </li>
          </ul>
        </div>

        {/* 重试按钮 */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            重新连接
          </button>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            或者稍后刷新页面
          </p>
        </div>

        {/* PWA提示 */}
        <div className="bg-[var(--theme-info-muted)] dark:bg-[var(--theme-info-muted)] border border-[var(--theme-info)]/20 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>提示：</strong>安装我们的应用，即使离线也能访问部分内容！
          </p>
        </div>
      </div>
    </div>
  )
}
