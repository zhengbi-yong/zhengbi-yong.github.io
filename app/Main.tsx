import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Hero3DSection from '@/components/Hero3DSection'
import PerformanceNotice from '@/components/PerformanceNotice'
import ShaderBackgroundWrapper from '@/components/ShaderBackgroundWrapper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card'
import { Badge } from '@/components/components/ui/badge'

interface HomeProps {
  posts: CoreContent<Blog>[]
}

const infoItems = [
  { label: '姓名', value: '雍征彼（Zhengbi Yong）' },
  { label: '邮箱', value: 'zhengbi.yong@outlook.com' },
  { label: '电话', value: '(+86) 186 0050 8939' },
  { label: '地址', value: '中国 · 北京 · 海淀' },
]

const eduItems = [
  {
    school: '清华大学 · 自动化系',
    detail: '本科 · 人工智能 / 控制理论',
  },
  {
    school: '北京理工大学 · 自动化学院',
    detail: '硕士 · 人工智能 / 控制理论',
  },
]

export default function Home({ posts }: HomeProps) {
  void posts
  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundWrapper intensity={0.8} />
      </div>
      {/* 主页内容 */}
      <div className="relative z-10 space-y-10 py-6">
        <Hero3DSection />
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none bg-gradient-to-br from-white/80 to-white/40 shadow-xl dark:from-gray-900/70 dark:to-gray-900/30">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>联系方式与常驻地</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col rounded-2xl border border-gray-100/60 p-4 dark:border-gray-800/60"
              >
                <span className="text-xs tracking-[0.3em] text-gray-500 uppercase">
                  {item.label}
                </span>
                <span className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
          <CardHeader>
            <CardTitle>教育与特长</CardTitle>
            <CardDescription className="text-gray-300">
              聚焦机器人、自动化与交互体验
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {eduItems.map((item) => (
              <div key={item.school} className="rounded-3xl border border-white/10 p-4">
                <p className="text-base font-semibold">{item.school}</p>
                <p className="text-sm text-gray-300">{item.detail}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Badge>机器人控制</Badge>
              <Badge variant="secondary">交互设计</Badge>
              <Badge variant="outline" className="text-white">
                算法工程
              </Badge>
              <Badge variant="secondary">GSAP / Three.js</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
      <PerformanceNotice />
      </div>
    </div>
  )
}
