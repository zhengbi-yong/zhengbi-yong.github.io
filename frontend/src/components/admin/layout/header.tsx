'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/shadcn/ui/button'
import { Avatar, AvatarFallback } from '@/components/shadcn/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'

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

interface HeaderProps {
  user?: { username?: string; email?: string } | null
  onLogout?: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, index) => ({
    label: pathLabels[seg] || seg,
    href: '/' + segments.slice(0, index + 1).join('/'),
  }))

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-sm px-4">
      {/* Left: breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/30">/</span>}
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

      {/* Right: theme toggle + user avatar */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              {theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />浅色
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />深色
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />跟随系统
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.username || '管理员'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
