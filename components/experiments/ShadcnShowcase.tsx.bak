'use client'

import { Button } from '@/components/components/ui/button'
import { Badge } from '@/components/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/components/ui/tabs'
import { Separator } from '@/components/components/ui/separator'

export default function ShadcnShowcase() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button>默认按钮</Button>
        <Button variant="outline">悬浮试试</Button>
        <Button variant="secondary">次要操作</Button>
        <Button variant="destructive">危险动作</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>交互</Badge>
        <Badge variant="secondary">体验</Badge>
        <Badge variant="outline">组件化</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>模块化卡片</CardTitle>
          <CardDescription>Shadcn/ui 与动效结合的最佳实践</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="design">
            <TabsList>
              <TabsTrigger value="design">设计</TabsTrigger>
              <TabsTrigger value="motion">动效</TabsTrigger>
              <TabsTrigger value="notes">备注</TabsTrigger>
            </TabsList>
            <TabsContent value="design" className="pt-4 text-sm text-gray-600">
              通过统一主题与 token 保证设计一致性，同时利用 Tailwind 快速布局。
            </TabsContent>
            <TabsContent value="motion" className="pt-4 text-sm text-gray-600">
              可以配合 GSAP/Framer Motion 实现流畅的进出场动画。
            </TabsContent>
            <TabsContent value="notes" className="pt-4 text-sm text-gray-600">
              配合骨架屏、进度条可实现渐进式加载体验。
            </TabsContent>
          </Tabs>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-end">
          <Button variant="ghost">更多示例</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
