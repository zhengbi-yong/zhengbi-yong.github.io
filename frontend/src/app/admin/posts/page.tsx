'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect to the full-featured posts management page.
 * The old Refine-based read-only page is superseded by /admin/posts-manage.
 */
export default function PostsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/posts-manage')
  }, [router])

  return null
}
