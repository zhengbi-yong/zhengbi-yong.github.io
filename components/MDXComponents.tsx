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
import { ExcalidrawEmbed } from './MDXComponents/ExcalidrawEmbed'

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

const ConfettiOnView = dynamic(
  () => import('./animations/ConfettiOnView').then((mod) => mod.default),
  {
    loading: () => null,
  }
)

// 动态导入乐谱组件
const MusicSheet = dynamic(() => import('./MusicSheet').then((mod) => mod.default), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载乐谱组件...</p>
      </div>
    </div>
  ),
})

// 动态导入化学结构组件
const ChemicalStructure = dynamic(
  () => import('./chemistry/ChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载3D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

const SimpleChemicalStructure = dynamic(
  () => import('./chemistry/SimpleChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载3D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

// 动态导入RDKit化学结构组件
const RDKitStructure = dynamic(
  () => import('./chemistry/RDKitStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载2D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

const MoleculeFingerprint = dynamic(
  () => import('./chemistry/MoleculeFingerprint').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-6 w-6 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载分子指纹...</p>
        </div>
      </div>
    ),
  }
)

// 动态导入图表组件
const EChartsComponent = dynamic(() => import('./charts').then((mod) => mod.EChartsComponent), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoBarChart = dynamic(() => import('./charts').then((mod) => mod.NivoBarChart), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoLineChart = dynamic(() => import('./charts').then((mod) => mod.NivoLineChart), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoPieChart = dynamic(() => import('./charts').then((mod) => mod.NivoPieChart), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const AntVChart = dynamic(() => import('./charts').then((mod) => mod.AntVChart), {
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图表组件...</p>
      </div>
    </div>
  ),
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

const WrappedConfettiOnView = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={null}>
      <ConfettiOnView {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

// 包装图表组件，使其可以在MDX中安全使用
const WrappedEChartsComponent = (props: any) => {
  // 提取formatter函数，其他props传递给组件
  const { option, ...restProps } = props
  const formatters: { [key: string]: Function } = {}

  // 从option中提取函数配置
  const safeOption = JSON.parse(JSON.stringify(option || {}))

  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <EChartsComponent option={safeOption} formatters={formatters} {...restProps} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

const WrappedNivoBarChart = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <NivoBarChart {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedNivoLineChart = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <NivoLineChart {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedNivoPieChart = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <NivoPieChart {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedAntVChart = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <AntVChart {...props} />
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
  ConfettiOnView: WrappedConfettiOnView,
  // 乐谱组件（动态导入，按需加载）
  MusicSheet,
  // 化学结构组件（动态导入，按需加载）
  ChemicalStructure,
  SimpleChemicalStructure,
  RDKitStructure,
  MoleculeFingerprint,
  // 图表组件（动态导入，按需加载，客户端渲染，带错误边界）
  EChartsComponent: WrappedEChartsComponent,
  NivoBarChart: WrappedNivoBarChart,
  NivoLineChart: WrappedNivoLineChart,
  NivoPieChart: WrappedNivoPieChart,
  AntVChart: WrappedAntVChart,
  // Excalidraw 绘图组件
  excalidraw: ExcalidrawEmbed,
}
