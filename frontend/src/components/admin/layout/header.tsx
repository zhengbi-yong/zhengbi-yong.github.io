'use client'

// import { usePathname } from 'next/navigation'  // unused — kept for reference
import BreadcrumbNav from '@/components/admin/BreadcrumbNav'

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4">
      <BreadcrumbNav />
    </header>
  )
}
