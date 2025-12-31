/**
 * 离线页面
 *
 * 当用户离线时显示此页面
 */

import { WiCloudOff } from 'react-icons/wi'
import Link from 'next/link'

export const metadata = {
  title: '离线',
  description: '您当前处于离线状态',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 图标 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-full animate-ping" />
            <div className="relative bg-blue-100 dark:bg-blue-900 p-6 rounded-full">
              <WiCloudOff className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            您当前离线
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            请检查您的网络连接后重试
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            部分内容可能仍可从缓存中访问
          </p>
        </div>

        {/* 缓存的文章列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-left">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            缓存的文章
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            您之前访问过的文章可能仍可离线查看：
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/blog"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <span className="mr-2">→</span>
                文章列表
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <span className="mr-2">→</span>
                关于作者
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
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
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            重新连接
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            或者稍后刷新页面
          </p>
        </div>

        {/* PWA提示 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>提示：</strong>安装我们的应用，即使离线也能访问部分内容！
          </p>
        </div>
      </div>
    </div>
  )
}
