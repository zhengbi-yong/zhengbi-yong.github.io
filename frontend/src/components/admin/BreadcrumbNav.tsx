/**
 * Breadcrumb Navigation Component
 * 面包屑导航组件，自动根据路径生成导航
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

// 路径标签映射
const pathLabels: Record<string, string> = {
  admin: '管理后台',
  users: '用户管理',
  comments: '评论管理',
  posts: '文章管理',
  analytics: '数据分析',
  monitoring: '系统监控',
  settings: '系统设置',
  health: '健康检查',
  metrics: '指标监控',
  show: '详情',
  edit: '编辑',
  new: '新建',
}

/**
 * 解析路径并生成面包屑项
 */
function parsePathname(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  // 首页
  items.push({
    label: '首页',
    href: '/',
  })

  // 管理后台首页
  if (segments[0] === 'admin' && segments.length === 1) {
    items.push({
      label: '仪表板',
      href: '/admin',
    })
    return items
  }

  // 构建层级路径
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // 跳过动态路由参数（如 :id, :slug）
    if (segment.startsWith(':') || segment.startsWith('[')) {
      return
    }

    const label = pathLabels[segment] || segment
    const isLast = index === segments.length - 1

    items.push({
      label,
      href: isLast ? pathname : currentPath,
    })
  })

  return items
}

export default function BreadcrumbNav() {
  const pathname = usePathname()
  const breadcrumbs = parsePathname(pathname)

  if (breadcrumbs.length <= 2) {
    return null
  }

  return (
    <nav className="admin-breadcrumb mb-0 flex min-h-10 items-center gap-1 rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 px-3 py-2 text-sm text-[var(--text-secondary)] backdrop-blur-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={item.href} className="admin-breadcrumb-item min-w-0 gap-1.5">
            {index > 0 && (
              <ChevronRight className="admin-breadcrumb-separator h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
            )}

            {index === 0 ? (
              <Link
                href={item.href}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors duration-[var(--motion-fast)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
            ) : isLast ? (
              <span className="truncate font-medium text-[var(--text-primary)]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="truncate text-[var(--text-secondary)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
