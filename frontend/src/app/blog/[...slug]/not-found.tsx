import Link from 'next/link'

/**
 * 文章未找到页面
 * 当用户访问不存在的文章时显示
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 dark:bg-background">
      <div className="w-full max-w-2xl text-center">
        {/* 404 图标 */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
              <span className="text-6xl font-bold text-primary dark:text-primary">404</span>
            </div>
            {/* 装饰性圆圈 */}
            <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-yellow-400 animate-ping" />
            <div className="absolute -left-2 -bottom-2 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {/* 标题和描述 */}
        <h1 className="mb-4 text-3xl font-bold text-foreground dark:text-foreground sm:text-4xl">
          文章未找到
        </h1>
        <p className="mb-8 text-lg text-muted-foreground dark:text-muted-foreground">
          抱歉，您要查找的文章不存在或已被删除。
        </p>

        {/* 建议操作 */}
        <div className="mb-8 rounded-lg bg-[var(--theme-info-muted)] p-6 text-left dark:bg-[var(--theme-info-muted)]">
          <h2 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-100">
            您可以尝试：
          </h2>
          <ul className="space-y-2 text-sm text-[var(--theme-fg)] dark:text-[var(--theme-fg)]">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-primary dark:text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>检查 URL 是否正确</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-primary dark:text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>浏览博客列表查找其他文章</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-primary dark:text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>使用搜索功能查找相关内容</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-primary dark:text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>返回首页重新开始浏览</span>
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none dark:bg-primary dark:hover:bg-primary"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            返回博客列表
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
