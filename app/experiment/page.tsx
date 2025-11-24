'use client'

import dynamic from 'next/dynamic'
import projectsData from '@/data/projectsData'
import ProjectCard from '@/components/Card'
import { Button } from '@/components/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/components/ui/card'
import { Badge } from '@/components/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/components/ui/tooltip'
import { Separator } from '@/components/components/ui/separator'
import FadeIn from '@/components/animations/FadeIn'
import SlideIn from '@/components/animations/SlideIn'
import ScaleIn from '@/components/animations/ScaleIn'

// 动态导入 Three.js 相关组件，实现代码分割
const ThreeJSViewer = dynamic(() => import('@/components/ThreeJSViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-100 dark:bg-gray-800">
      <p className="text-gray-600 dark:text-gray-400">加载 3D 模型中...</p>
    </div>
  ),
})

// 动态导入 ParticleBackground 组件（可选，进一步优化）
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
})

export default function Projects() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          实验
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">网站新功能试验场</p>
      </div>
      {/* 3D渲染容器 */}
      <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">3D URDF模型加载</p>
      <div className="my-4">
        <ThreeJSViewer />
      </div>
      <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">Shadcn 组件集成</p>
      <div className="space-y-6 py-6">
        {/* Button 组件 */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Button 组件</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                alert('默认按钮被点击！')
              }}
            >
              默认按钮
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                alert('次要按钮被点击！')
              }}
            >
              次要按钮
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                alert('轮廓按钮被点击！')
              }}
            >
              轮廓按钮
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                alert('幽灵按钮被点击！')
              }}
            >
              幽灵按钮
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                alert('危险按钮被点击！')
              }}
            >
              危险按钮
            </Button>
            <Button
              size="sm"
              onClick={() => {
                alert('小按钮被点击！')
              }}
            >
              小按钮
            </Button>
            <Button
              size="lg"
              onClick={() => {
                alert('大按钮被点击！')
              }}
            >
              大按钮
            </Button>
            <Button
              disabled
              onClick={() => {
                alert('这个按钮被禁用了，不应该触发')
              }}
            >
              禁用按钮
            </Button>
          </div>
        </div>

        <Separator />

        {/* Badge 组件 */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Badge 组件</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>默认</Badge>
            <Badge variant="secondary">次要</Badge>
            <Badge variant="destructive">危险</Badge>
            <Badge variant="outline">轮廓</Badge>
          </div>
        </div>

        <Separator />

        {/* Card 组件 */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Card 组件</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>卡片标题</CardTitle>
                <CardDescription>这是卡片的描述信息</CardDescription>
              </CardHeader>
              <CardContent>
                <p>这是卡片的内容区域，可以放置任何内容。</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => {
                    alert('卡片中的按钮被点击！')
                  }}
                >
                  操作按钮
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>另一个卡片</CardTitle>
                <CardDescription>展示不同的卡片样式</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card 组件非常适合展示项目、文章摘要等内容。</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Tooltip 组件 */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Tooltip 组件</h3>
          <div className="flex gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">悬停查看提示</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个工具提示</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">另一个提示</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>提示信息可以包含更多内容</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator />

        {/* Separator 组件 */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Separator 组件</h3>
          <div className="space-y-2">
            <p>分隔线上方的内容</p>
            <Separator />
            <p>分隔线下方的内容</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Framer Motion 动画组件示例 */}
      <div className="space-y-6 py-6">
        <h2 className="text-2xl font-bold">Framer Motion 动画组件</h2>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          使用 Framer Motion 实现的高级动画效果
        </p>

        {/* FadeIn 示例 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">FadeIn - 淡入动画</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FadeIn delay={0} duration={0.5}>
              <div className="rounded-lg border bg-gray-100 p-4 dark:bg-gray-800">
                <p>无延迟淡入</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2} duration={0.5}>
              <div className="rounded-lg border bg-gray-100 p-4 dark:bg-gray-800">
                <p>延迟 0.2s 淡入</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.4} duration={0.5} whileInView={true}>
              <div className="rounded-lg border bg-gray-100 p-4 dark:bg-gray-800">
                <p>滚动触发淡入</p>
              </div>
            </FadeIn>
          </div>
        </div>

        <Separator />

        {/* SlideIn 示例 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">SlideIn - 滑入动画</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SlideIn direction="up" delay={0} whileInView={true}>
              <div className="rounded-lg border bg-blue-100 p-4 dark:bg-blue-900">
                <p>向上滑入</p>
              </div>
            </SlideIn>
            <SlideIn direction="down" delay={0.1} whileInView={true}>
              <div className="rounded-lg border bg-green-100 p-4 dark:bg-green-900">
                <p>向下滑入</p>
              </div>
            </SlideIn>
            <SlideIn direction="left" delay={0.2} whileInView={true}>
              <div className="rounded-lg border bg-yellow-100 p-4 dark:bg-yellow-900">
                <p>向左滑入</p>
              </div>
            </SlideIn>
            <SlideIn direction="right" delay={0.3} whileInView={true}>
              <div className="rounded-lg border bg-purple-100 p-4 dark:bg-purple-900">
                <p>向右滑入</p>
              </div>
            </SlideIn>
          </div>
        </div>

        <Separator />

        {/* ScaleIn 示例 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">ScaleIn - 缩放进入动画</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <ScaleIn delay={0} scale={0.5} whileInView={true}>
              <div className="rounded-lg border bg-red-100 p-4 dark:bg-red-900">
                <p>从 0.5 倍缩放</p>
              </div>
            </ScaleIn>
            <ScaleIn delay={0.2} scale={0.8} whileInView={true}>
              <div className="rounded-lg border bg-orange-100 p-4 dark:bg-orange-900">
                <p>从 0.8 倍缩放</p>
              </div>
            </ScaleIn>
            <ScaleIn delay={0.4} scale={0.9} whileInView={true}>
              <div className="rounded-lg border bg-pink-100 p-4 dark:bg-pink-900">
                <p>从 0.9 倍缩放</p>
              </div>
            </ScaleIn>
          </div>
        </div>

        <Separator />

        {/* 组合动画示例 */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">组合动画示例</h3>
          <div className="space-y-4">
            <SlideIn direction="up" delay={0} whileInView={true}>
              <div className="rounded-lg border bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                <h4 className="mb-2 text-xl font-bold">组合动画卡片</h4>
                <p className="mb-4">这个卡片使用了滑入和淡入的组合效果</p>
                <ScaleIn delay={0.3} whileInView={true}>
                  <button className="rounded bg-white px-4 py-2 text-blue-500 hover:bg-gray-100">
                    点击按钮
                  </button>
                </ScaleIn>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>

      <Separator />

      {/* 粒子背景特效示例 */}
      <div className="space-y-6 py-6">
        <h2 className="text-2xl font-bold">粒子背景特效</h2>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          使用 Canvas API 实现的轻量级粒子背景效果
        </p>

        <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900">
          <ParticleBackground particleCount={50} speed={0.5} />
          <div className="relative z-10 flex h-full items-center justify-center">
            <div className="rounded-lg bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
              <h3 className="mb-2 text-xl font-bold">粒子背景示例</h3>
              <p className="text-gray-600 dark:text-gray-300">
                这个区域展示了粒子背景特效，粒子会自动移动并连接形成网络效果。
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative h-48 w-full overflow-hidden rounded-lg border bg-gradient-to-br from-blue-500 to-purple-500">
            <ParticleBackground particleCount={30} color="rgba(255, 255, 255, 0.2)" speed={0.3} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <p className="text-white">较少粒子，较慢速度</p>
            </div>
          </div>
          <div className="relative h-48 w-full overflow-hidden rounded-lg border bg-gradient-to-br from-green-500 to-teal-500">
            <ParticleBackground particleCount={80} color="rgba(255, 255, 255, 0.15)" speed={0.8} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <p className="text-white">较多粒子，较快速度</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
