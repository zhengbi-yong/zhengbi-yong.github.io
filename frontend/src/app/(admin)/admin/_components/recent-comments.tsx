'use client'

import { Card, CardContent } from '@/components/shadcn/ui/card'

export function RecentComments({
  pending,
  approved,
  rejected,
  total,
}: {
  pending: number
  approved: number
  rejected: number
  total: number
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span>待审核</span>
          <span className="font-medium">{pending}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>已通过</span>
          <span className="font-medium">{approved}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>已拒绝</span>
          <span className="font-medium">{rejected}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-2">
          <span>总计</span>
          <span>{total}</span>
        </div>
      </CardContent>
    </Card>
  )
}
