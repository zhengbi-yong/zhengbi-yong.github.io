import '@/styles/prism.css'
import 'katex/dist/katex.css'

import dynamic from 'next/dynamic'

// 动态导入客户端组件，避免在 Server Component 中直接导入
const DynamicPostPage = dynamic(
  () => import('./DynamicPostPage').then((mod) => mod.DynamicPostPage),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
          </div>
        </div>
      </div>
    ),
  }
)

import { Metadata } from 'next'
 
 

// LayoutProps interface removed: unused type

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  // Generate basic metadata - detailed metadata will be loaded dynamically
  return {
    title: slug,
    description: `Post: ${slug}`,
    openGraph: {
      title: slug,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: slug,
    },
  }
}

// 缓存配置：动态模式时1小时重新验证
export const revalidate = 3600

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  // ALWAYS use database - no static fallback
  return <DynamicPostPage slug={slug} />
}
