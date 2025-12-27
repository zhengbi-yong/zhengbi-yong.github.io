import PostSkeleton from '@/components/ui/Skeleton/PostSkeleton'
import SectionContainer from '@/components/SectionContainer'

/**
 * 文章详情页加载状态
 * Next.js 会自动在数据加载时显示此组件
 */
export default function PostLoading() {
  return (
    <SectionContainer>
      <PostSkeleton />
    </SectionContainer>
  )
}
