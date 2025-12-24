import { getSortedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import BookShelfLayout from '@/layouts/BookShelfLayout'

export const metadata = genPageMetadata({ title: 'Blog' })

// 兼容性配置：静态导出时强制静态渲染，动态模式时允许动态渲染
export const dynamic = 'force-static'

// 缓存配置：动态模式时1小时重新验证
// 注意：静态导出模式下，revalidate 不需要设置（页面已经是静态的）
// 对于动态部署，使用 3600 秒（1小时）的重新验证时间
export const revalidate = 3600

export default async function BlogPage() {
  const sortedPosts = getSortedPosts()

  return (
    <div className="relative min-h-screen">
      <BookShelfLayout posts={sortedPosts} title="博客书架" />
    </div>
  )
}
