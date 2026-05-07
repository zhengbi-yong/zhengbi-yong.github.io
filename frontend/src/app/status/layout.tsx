import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '系统状态 - 雍征彼的博客',
  description: '实时服务状态监控、自动化测试结果和功能可用性检查',
  robots: 'noindex, nofollow',
}

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
