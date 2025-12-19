import { getSortedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import BookShelfLayout from '@/layouts/BookShelfLayout'
import ShaderBackgroundClient from '@/components/ShaderBackgroundClient'

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
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundClient intensity={0.8} />
      </div>
      {/* 博客内容 */}
      <div className="relative z-10">
        {/* 内容背景遮罩 - 提升文字可读性 */}
        <div className="fixed inset-0 -z-[5] bg-white/50 backdrop-blur-sm dark:bg-gray-950/60" />
        <BookShelfLayout posts={sortedPosts} title="博客书架" />
      </div>
    </div>
  )
}
