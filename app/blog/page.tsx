import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayout'
import ShaderBackgroundClient from '@/components/ShaderBackgroundClient'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Blog' })

// 兼容性配置：静态导出时强制静态渲染，动态模式时允许动态渲染
export const dynamic = 'force-static'

// 缓存配置：动态模式时1小时重新验证
// 注意：静态导出模式下，revalidate 不需要设置（页面已经是静态的）
// 对于动态部署，使用 3600 秒（1小时）的重新验证时间
export const revalidate = 3600

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const sortedPosts = getSortedPosts()
  
  // 兼容性处理：静态导出时使用默认第一页，动态模式时使用 searchParams
  // 这样可以同时支持静态导出和动态部署
  const isStaticExport = process.env.EXPORT === '1'
  let pageNumber = 1
  
  if (!isStaticExport) {
    // 动态模式：使用 searchParams 支持分页
    const params = await props.searchParams
    pageNumber = parseInt(params.page || '1', 10)
  }
  // 静态导出模式：默认使用第一页，分页通过 /blog/page/[page] 路由处理
  
  const { posts, pagination } = getPaginatedPosts(sortedPosts, pageNumber, POSTS_PER_PAGE)

  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundClient intensity={0.8} />
      </div>
      {/* 博客内容 */}
      <div className="relative z-10">
        {/* 内容背景遮罩 - 提升文字可读性 */}
        <div className="fixed inset-0 -z-[5] bg-white/50 dark:bg-gray-950/60 backdrop-blur-sm" />
        <ListLayout
          posts={sortedPosts}
          initialDisplayPosts={posts}
          pagination={pagination}
          title="博客"
        />
      </div>
    </div>
  )
}
