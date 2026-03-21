/**
 * 🚀 世界级性能优化 - 快速开始示例
 *
 * 本文件展示了如何在您的项目中使用所有新实现的优化功能
 */

// ==========================================
// 1. 虚拟滚动 - 渲染大型列表
// ==========================================

import { VirtualList } from '@/components/performance/VirtualList'

export function LargeListExample() {
  // 生成100,000条数据
  const items = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    title: `Post ${i + 1}`,
    description: `This is the description for post ${i + 1}`,
    author: `Author ${i % 100}`,
    date: new Date(Date.now() - i * 1000 * 60 * 60).toLocaleDateString(),
  }))

  return (
    <div className="h-screen">
      <h1 className="text-2xl font-bold mb-4">100,000 Posts</h1>

      <VirtualList
        items={items}
        renderItem={(post) => (
          <div className="p-4 border-b">
            <h3 className="font-semibold">{post.title}</h3>
            <p className="text-sm text-gray-600">{post.description}</p>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span>{post.author}</span>
              <span>{post.date}</span>
            </div>
          </div>
        )}
        estimatedItemHeight={100}
        height={800}
        getKey={(post) => post.id}
        bufferSize={5}
        onLoadMore={() => console.log('Load more...')}
      />
    </div>
  )
}

// ==========================================
// 2. 渐进式图片 - Blurhash加载
// ==========================================

import { ProgressiveImage } from '@/components/performance/ProgressiveImage'

export function ProgressiveImageExample() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Progressive Image Loading</h1>

      {/* 基础用法 */}
      <ProgressiveImage
        src="/images/hero.jpg"
        blurhash="L9K}e}%M9Fxu_4RP%MRPYIM{Rk%MRk"
        alt="Hero image"
        width={1200}
        height={630}
      />

      {/* 带淡入动画 */}
      <ProgressiveImage
        src="/images/photo.jpg"
        blurhash="L6PZfSi_.AyE_3t7t7R**0o~%Noz"
        alt="Photo"
        width={800}
        height={600}
        fadeIn
        fadeDuration={500}
      />

      {/* 响应式图片 */}
      <ProgressiveImage
        src="/images/responsive.jpg"
        blurhash="LGF5?x_NFjM{Nfn$NHn%I@n%Nfn$"
        alt="Responsive"
        srcSet="/images/small.jpg 400w, /images/medium.jpg 800w, /images/large.jpg 1200w"
        sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
      />

      {/* 优先级加载 */}
      <ProgressiveImage
        src="/images/important.jpg"
        blurhash="LKN]Rv%2Tw+w[~pmRPoZRiPwdv[a"
        alt="Important"
        width={800}
        height={600}
        priority // 首屏图片
        fetchPriority="high"
      />
    </div>
  )
}

// ==========================================
// 3. 智能预加载 - 预测性加载
// ==========================================

import { smartPreloader, useSmartPreload, useHoverPreload } from '@/lib/performance/smart-preloader'

export function SmartPreloaderExample() {
  // 添加预加载任务
  useEffect(() => {
    // 预加载下一页数据
    smartPreloader.add({
      id: 'next-page',
      url: '/api/posts?page=2',
      type: 'fetch',
      priority: 'high',
      predictionScore: 0.9,
    })

    // 预加载关键图片
    smartPreloader.add({
      id: 'hero-image',
      url: '/images/hero.jpg',
      type: 'image',
      priority: 'critical',
      predictionScore: 1.0,
    })

    // 查看统计
    const stats = smartPreloader.getStats()
    console.log('Preloader stats:', stats)
  }, [])

  return <div>Smart preloading is active!</div>
}

// 鼠标悬停预加载
export function LinkWithPreload({ href, children }: { href: string; children: React.ReactNode }) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  useHoverPreload(linkRef.current, {
    id: `preload-${href}`,
    url: href,
    type: 'document',
    priority: 'medium',
    predictionScore: 0.8,
  })

  return (
    <a ref={linkRef} href={href}>
      {children}
    </a>
  )
}

// ==========================================
// 4. 骨架屏 - 加载占位
// ==========================================

import {
  Skeleton,
  ArticleSkeleton,
  CardSkeleton,
  BlogGridSkeleton,
  CommentSkeleton,
} from '@/components/performance/Skeleton'

export function SkeletonExample() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Skeleton Screens</h1>

      {/* 基础骨架屏 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Skeleton</h2>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-2" />
        <Skeleton className="h-4 w-4/6 mt-2" />
      </div>

      {/* 文章骨架屏 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Article Skeleton</h2>
        <ArticleSkeleton showImage titleLines={2} excerptLines={3} />
      </div>

      {/* 卡片骨架屏 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Card Skeleton</h2>
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>

      {/* 博客网格骨架屏 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Blog Grid Skeleton</h2>
        <BlogGridSkeleton count={6} />
      </div>

      {/* 评论骨架屏 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Comment Skeleton</h2>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    </div>
  )
}

// ==========================================
// 5. AI内容摘要
// ==========================================

import { useAISummarizer, aiSummarizer } from '@/lib/ai/ai-summarizer'

export function AISummaryExample() {
  const { summarize, isLoading, error } = useAISummarizer()

  const [text, setText] = useState(`
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
    nisi ut aliquip ex ea commodo consequat...
  `)

  const [summary, setSummary] = useState<string | null>(null)

  const handleSummarize = async () => {
    try {
      const result = await summarize(text, {
        type: 'bullet',
        length: 'short',
        includeKeyPoints: true,
        maxKeyPoints: 3,
      })

      setSummary(result.summary)
      console.log('Compression ratio:', result.compressionRatio)
      console.log('Confidence:', result.confidence)
    } catch (err) {
      console.error('Summarization failed:', err)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Summarizer</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-40 p-4 border rounded"
        placeholder="Enter text to summarize..."
      />

      <button
        onClick={handleSummarize}
        disabled={isLoading}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Summarizing...' : 'Summarize'}
      </button>

      {error && <p className="mt-4 text-red-500">{error.message}</p>}

      {summary && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <div className="p-4 bg-gray-50 rounded">{summary}</div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 6. AI聊天助手
// ==========================================

import { AIChatAssistant } from '@/components/ai/AIChatAssistant'

export function AIAssistantExample() {
  return (
    <div>
      {/* 页面内容 */}
      <h1>My Blog Post</h1>
      <p>This is a blog post...</p>

      {/* AI助手 */}
      <AIChatAssistant
        onSend={async (message) => {
          // 调用您的AI API
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          }).then((res) => res.json())

          return response.reply
        }}
        options={{
          stream: true,
          showThinking: true,
          temperature: 0.7,
          maxTokens: 500,
        }}
        quickQuestions={[
          '这篇文章讲了什么？',
          '总结关键观点',
          '解释这个概念',
          '提供相关资源',
        ]}
        collapsible
        defaultExpanded={true}
      />
    </div>
  )
}

// ==========================================
// 7. 性能监控仪表板
// ==========================================

import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard'

export function PerformanceMonitorExample() {
  return (
    <div className="min-h-screen">
      {/* 您的应用内容 */}
      <h1>My App</h1>

      {/* 性能仪表板（开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 w-96">
          <PerformanceDashboard
            autoStart={true}
            refreshInterval={1000}
            metrics={['vitals', 'resources', 'memory', 'fps', 'score']}
          />
        </div>
      )}
    </div>
  )
}

// ==========================================
// 8. 完整集成示例 - 博客文章页
// ==========================================

export function OptimizedBlogPostPage({ post }) {
  const { summarize, isLoading: isSummarizing } = useAISummarizer()
  const [summary, setSummary] = useState<string | null>(null)

  // 预加载相关文章
  useEffect(() => {
    post.relatedPosts.forEach((relatedPost) => {
      smartPreloader.add({
        id: `related-${relatedPost.id}`,
        url: relatedPost.url,
        type: 'document',
        priority: 'low',
        predictionScore: 0.5,
      })
    })
  }, [post.relatedPosts])

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* 渐进式首图 */}
      <ProgressiveImage
        src={post.coverImage}
        blurhash={post.blurhash}
        alt={post.title}
        width={1200}
        height={630}
        priority
        className="w-full rounded-lg mb-8"
      />

      {/* 文章元信息 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex gap-4 text-gray-600">
          <span>{post.author}</span>
          <span>{post.date}</span>
          <span>{post.readTime} min read</span>
        </div>
      </header>

      {/* AI摘要 */}
      {summary && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">AI 摘要</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {/* 摘要按钮 */}
      <button
        onClick={() => summarize(post.content, { type: 'paragraph', length: 'short' })
          .then(result => setSummary(result.summary))}
        disabled={isSummarizing}
        className="mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isSummarizing ? '生成中...' : '生成AI摘要'}
      </button>

      {/* 文章内容 */}
      <div className="prose max-w-none mb-8">
        {post.content}
      </div>

      {/* 相关文章（使用虚拟滚动） */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">相关文章</h2>

        {post.relatedPosts.length > 50 ? (
          <VirtualList
            items={post.relatedPosts}
            renderItem={(relatedPost) => (
              <div key={relatedPost.id} className="p-4 border rounded mb-4">
                <h3 className="font-semibold">{relatedPost.title}</h3>
                <p className="text-sm text-gray-600">{relatedPost.excerpt}</p>
              </div>
            )}
            estimatedItemHeight={120}
            height={600}
            getKey={(p) => p.id}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {post.relatedPosts.map((relatedPost) => (
              <LinkWithPreload
                key={relatedPost.id}
                href={relatedPost.url}
              >
                <Card>
                  <h3 className="font-semibold">{relatedPost.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{relatedPost.excerpt}</p>
                </Card>
              </LinkWithPreload>
            ))}
          </div>
        )}
      </section>

      {/* AI助手 */}
      <AIChatAssistant
        onSend={async (message) => {
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              context: post.title,
            }),
          }).then((res) => res.json())

          return response.reply
        }}
        quickQuestions={[
          `总结《${post.title}》`,
          '这篇文章的主要观点是什么？',
          '解释文中的关键概念',
        ]}
      />
    </article>
  )
}

// ==========================================
// 9. 完整集成示例 - 主页
// ==========================================

export function OptimizedHomePage() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 智能预加载热门内容
    smartPreloader.add({
      id: 'trending-posts',
      url: '/api/posts/trending',
      type: 'fetch',
      priority: 'high',
      predictionScore: 0.95,
    })

    // 获取文章
    fetchPosts().then((data) => {
      setPosts(data)
      setIsLoading(false)
    })
  }, [])

  return (
    <main className="min-h-screen">
      {/* 英雄区域 */}
      <section className="relative h-screen">
        <ProgressiveImage
          src="/images/hero-bg.jpg"
          blurhash="L6PZfSi_.AyE_3t7t7R**0o~%Noz"
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
          priority
        />

        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to My Blog
            </h1>
            <p className="text-xl text-white">
              World-class performance optimization
            </p>
          </div>
        </div>
      </section>

      {/* 文章列表 */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Latest Posts</h2>

        {isLoading ? (
          <BlogGridSkeleton count={6} />
        ) : (
          <VirtualList
            items={posts}
            renderItem={(post) => (
              <Card
                key={post.id}
                className="hover:shadow-lg transition-shadow"
              >
                <ProgressiveImage
                  src={post.thumbnail}
                  blurhash={post.blurhash}
                  alt={post.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-t"
                />

                <div className="p-4">
                  <h3 className="font-semibold text-lg">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{post.excerpt}</p>
                </div>
              </Card>
            )}
            estimatedItemHeight={400}
            height={800}
            getKey={(post) => post.id}
          />
        )}
      </section>

      {/* 性能仪表板（开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 w-96">
          <PerformanceDashboard autoStart refreshInterval={2000} />
        </div>
      )}
    </main>
  )
}
