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

  // 如果只有首页和当前页，不显示面包屑
  if (breadcrumbs.length <= 2) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}

            {index === 0 ? (
              // 首页图标
              <Link
                href={item.href}
                className="flex items-center hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : isLast ? (
              // 当前页
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.label}
              </span>
            ) : (
              // 中间层级
              <Link
                href={item.href}
                className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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
