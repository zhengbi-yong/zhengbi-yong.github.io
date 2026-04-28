'use client'

import { Avatar, AvatarFallback } from '@/components/shadcn/ui/avatar'
import { Badge } from '@/components/shadcn/ui/badge'

interface RecentCommentsProps {
  pending: number
  approved: number
  rejected: number
  total: number
}

export function RecentComments({ pending, approved, rejected, total }: RecentCommentsProps) {
  const items = [
    {
      label: '待审核',
      value: pending,
      percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
      badge: 'warning',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: '已通过',
      value: approved,
      percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      badge: 'success',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: '已拒绝',
      value: rejected,
      percentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
      badge: 'destructive',
      color: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
    },
  ]

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-4">
          <Avatar className="flex h-9 w-9 items-center justify-center border">
            <AvatarFallback className={item.bgClass}>
              <span className={`text-xs font-bold ${item.color}`}>
                {item.value}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.percentage}% 的评论
              </p>
            </div>
            <Badge
              variant={
                item.badge === 'warning'
                  ? 'outline'
                  : item.badge === 'success'
                    ? 'default'
                    : 'destructive'
              }
            >
              {item.value}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
