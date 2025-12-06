/**
 * MatterAnimation 组件使用示例
 * 
 * 使用前需要安装依赖：
 * yarn add matter-js
 * 或
 * npm install matter-js
 * 
 * 如果需要 TypeScript 类型支持：
 * yarn add -D @types/matter-js
 * 或
 * npm install -D @types/matter-js
 */

import MatterAnimation from '@/components/MatterAnimation'

// 示例 1: 使用默认图标
export function Example1() {
  return (
    <div className="h-[600px] w-full">
      <MatterAnimation />
    </div>
  )
}

// 示例 2: 自定义图标列表
export function Example2() {
  const techStackIcons = [
    '/static/images/logo.png',
    '/static/images/github-traffic.png',
    '/static/images/google.png',
    // 添加更多图标路径
  ]

  return (
    <div className="h-[600px] w-full">
      <MatterAnimation
        iconUrls={techStackIcons}
        count={10}
        scaleFactor={0.8}
        noRotate={false}
      />
    </div>
  )
}

// 示例 3: 在首页中使用
export function HomePageExample() {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold mb-8">技术栈</h2>
      <div className="h-[500px] w-full rounded-xl overflow-hidden">
        <MatterAnimation
          iconUrls={[
            '/static/images/logo.png',
            '/static/images/github-traffic.png',
          ]}
          count={12}
          containerClassName="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        />
      </div>
    </section>
  )
}





