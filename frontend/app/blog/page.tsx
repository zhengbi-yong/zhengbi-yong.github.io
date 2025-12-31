import { getSortedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import BlogPageWrapper from './BlogPageWrapper'

export const metadata = genPageMetadata({ title: 'Blog' })

// 兼容性配置：静态导出时强制静态渲染，动态模式时允许动态渲染
export const dynamic = 'force-static'

// 缓存配置：动态模式时1小时重新验证
export const revalidate = 3600

// 服务器组件：获取静态数据作为fallback
const sortedPosts = getSortedPosts()

export default function BlogPage() {
  return <BlogPageWrapper fallbackPosts={sortedPosts} />
}
