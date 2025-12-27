import BlogSkeleton from '@/components/ui/Skeleton/BlogSkeleton'

/**
 * 博客列表页加载状态
 * Next.js 会自动在数据加载时显示此组件
 */
export default function BlogLoading() {
  return <BlogSkeleton />
}
