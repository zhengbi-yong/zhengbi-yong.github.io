import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import AnimatedSection from './AnimatedSection'
import AnimatedList from './AnimatedList'
import { AnimationSkeleton } from './loaders/AnimationSkeleton'
import { AnimationErrorBoundary } from './AnimationErrorBoundary'

// 动态导入动画组件，减少初始 bundle 大小
// 注意：在 Server Component 中不能使用 ssr: false，但这些组件本身已经是 Client Components
const FadeIn = dynamic(() => import('./animations/FadeIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const SlideIn = dynamic(() => import('./animations/SlideIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const ScaleIn = dynamic(() => import('./animations/ScaleIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const RotateIn = dynamic(() => import('./animations/RotateIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const BounceIn = dynamic(() => import('./animations/BounceIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

// 包装动画组件，添加错误边界和 Suspense
// 注意：不使用 memo，因为 MDX 组件每次渲染都会创建新的 props 对象
const WrappedFadeIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <FadeIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedSlideIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <SlideIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedScaleIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <ScaleIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedRotateIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <RotateIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedBounceIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <BounceIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  // 第一阶段动画组件（向后兼容）
  AnimatedSection,
  AnimatedList,
  // Framer Motion 动画组件（动态导入，按需加载，带错误边界）
  FadeIn: WrappedFadeIn,
  SlideIn: WrappedSlideIn,
  ScaleIn: WrappedScaleIn,
  RotateIn: WrappedRotateIn,
  BounceIn: WrappedBounceIn,
}
