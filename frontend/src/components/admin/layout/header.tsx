'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { SidebarTrigger } from '@/components/shadcn/ui/sidebar'

const pathLabels: Record<string, string> = {
  'admin': '管理后台',
  'posts': '文章管理',
  'posts-manage': '文章管理',
  'users': '用户管理',
  'comments': '评论审核',
  'analytics': '数据分析',
  'monitoring': '系统监控',
  'settings': '系统设置',
  'edit': '编辑',
  'create': '创建',
  'versions': '版本历史',
  'categories': '分类管理',
}

export function Header() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, index) => ({
    label: pathLabels[seg] || seg,
    href: '/' + segments.slice(0, index + 1).join('/'),
  }))

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger>
        <PanelLeft className="h-4 w-4" />
      </SidebarTrigger>

      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/40">/</span>}
            {i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
