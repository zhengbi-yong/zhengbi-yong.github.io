/**
 * Admin Layout - 为所有管理页面提供统一的布局和 Refine 上下文
 */

import { RefineProvider } from '@/lib/providers/refine-provider'
import AdminLayout from '@/components/admin/AdminLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RefineProvider>
      <AdminLayout>{children}</AdminLayout>
    </RefineProvider>
  )
}

