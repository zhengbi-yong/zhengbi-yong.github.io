'use client'

import dynamic from 'next/dynamic'
import {
  Suspense,
  Children,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import Image from './Image'
import CustomLink from './Link'
import AnimatedSection from './AnimatedSection'
import AnimatedList from './AnimatedList'
import { AnimationSkeleton } from './loaders/AnimationSkeleton'
import { AnimationErrorBoundary } from './AnimationErrorBoundary'
import { ExcalidrawEmbed } from './MDXComponents/ExcalidrawEmbed'
import SheetMusic, { ABCCodeBlock } from './SheetMusic'
import { CodeBlock } from './mdx/CodeBlock'
import BilibiliVideo from './BilibiliVideo'

// 动态导入动画组件，减少初始 bundle 大小
// 注意：在 Server Component 中不能使用 ssr: false，但这些组件本身已经是 Client Components
const FadeIn = dynamic(() => import('./animations/FadeIn').then((mod) => mod.default), {
  ssr: false,
  loading: () => <AnimationSkeleton />,
})

const SlideIn = dynamic(() => import('./animations/SlideIn').then((mod) => mod.default), {
  ssr: false,
  loading: () => <AnimationSkeleton />,
})

const ScaleIn = dynamic(() => import('./animations/ScaleIn').then((mod) => mod.default), {
  ssr: false,
  loading: () => <AnimationSkeleton />,
})

const RotateIn = dynamic(() => import('./animations/RotateIn').then((mod) => mod.default), {
  ssr: false,
  loading: () => <AnimationSkeleton />,
})

const BounceIn = dynamic(() => import('./animations/BounceIn').then((mod) => mod.default), {
  ssr: false,
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
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载乐谱组件...</p>
      </div>
    </div>
  ),
})

// 动态导入化学结构组件
const ChemicalStructure = dynamic(
  () => import('./chemistry/ChemicalStructure').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载3D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

const SimpleChemicalStructure = dynamic(
  () => import('./chemistry/SimpleChemicalStructure').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载3D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

// 动态导入RDKit化学结构组件
const RDKitStructure = dynamic(
  () => import('./chemistry/RDKitStructure').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载2D结构查看器...</p>
        </div>
      </div>
    ),
  }
)

const MoleculeFingerprint = dynamic(
  () => import('./chemistry/MoleculeFingerprint').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 items-center justify-center rounded-lg border border-dashed border-border p-4 dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-6 w-6 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载分子指纹...</p>
        </div>
      </div>
    ),
  }
)

// 动态导入 Gaussian Splatting 组件 (Spark 2.0, World Labs)
const GaussianSplat = dynamic(
  () => import('./gaussian-splat/GaussianSplat').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading 3D Gaussian Splat viewer...</p>
        </div>
      </div>
    ),
  }
)

// 动态导入图表组件
const EChartsComponent = dynamic(() => import('./charts').then((mod) => mod.EChartsComponent), {
  ssr: false,
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoBarChart = dynamic(() => import('./charts').then((mod) => mod.NivoBarChart), {
  ssr: false,
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoLineChart = dynamic(() => import('./charts').then((mod) => mod.NivoLineChart), {
  ssr: false,
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const NivoPieChart = dynamic(() => import('./charts').then((mod) => mod.NivoPieChart), {
  ssr: false,
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

const AntVChart = dynamic(() => import('./charts').then((mod) => mod.AntVChart), {
  ssr: false,
  loading: () => (
    <div className="my-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">正在加载图表组件...</p>
      </div>
    </div>
  ),
})

// ── Placeholder for animation wrappers that have no children ──
// When an animation component like <FadeIn /> is rendered without
// wrapping any content, show a visible placeholder so the component
// isn't invisible.  Users can wrap content inside the animation by
// placing paragraphs between a pair of animation markers in the editor.

const ANIMATION_COLORS: Record<string, { border: string; bg: string; text: string; subtext: string }> = {
  blue:    { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50/50 dark:bg-blue-900/10', text: 'text-blue-600 dark:text-blue-400', subtext: 'text-blue-400 dark:text-blue-500' },
  green:   { border: 'border-green-300 dark:border-green-700', bg: 'bg-green-50/50 dark:bg-green-900/10', text: 'text-green-600 dark:text-green-400', subtext: 'text-green-400 dark:text-green-500' },
  purple:  { border: 'border-purple-300 dark:border-purple-700', bg: 'bg-purple-50/50 dark:bg-purple-900/10', text: 'text-purple-600 dark:text-purple-400', subtext: 'text-purple-400 dark:text-purple-500' },
  orange:  { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50/50 dark:bg-orange-900/10', text: 'text-orange-600 dark:text-orange-400', subtext: 'text-orange-400 dark:text-orange-500' },
  pink:    { border: 'border-pink-300 dark:border-pink-700', bg: 'bg-pink-50/50 dark:bg-pink-900/10', text: 'text-pink-600 dark:text-pink-400', subtext: 'text-pink-400 dark:text-pink-500' },
}

function AnimationPlaceholder({ name, color }: { name: string; color: string }) {
  const c = ANIMATION_COLORS[color] || ANIMATION_COLORS.blue
  return (
    <div className={`my-4 rounded-lg border-2 border-dashed px-4 py-6 text-center ${c.border} ${c.bg}`}>
      <div className="text-2xl mb-2">✨</div>
      <div className={`text-sm font-mono ${c.text}`}>{name} 动画容器</div>
      <div className={`text-xs mt-1 ${c.subtext}`}>将内容放在此动画之间以应用效果</div>
    </div>
  )
}

// 包装动画组件，添加错误边界和 Suspense
// 注意：不使用 memo，因为 MDX 组件每次渲染都会创建新的 props 对象
const WrappedFadeIn = (props: any) => {
  if (!props.children) {
    return <AnimationPlaceholder name="FadeIn 淡入" color="blue" />
  }
  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <FadeIn {...props} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

const WrappedSlideIn = (props: any) => {
  if (!props.children) {
    return <AnimationPlaceholder name="SlideIn 滑入" color="green" />
  }
  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <SlideIn {...props} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

const WrappedScaleIn = (props: any) => {
  if (!props.children) {
    return <AnimationPlaceholder name="ScaleIn 缩放" color="purple" />
  }
  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <ScaleIn {...props} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

const WrappedRotateIn = (props: any) => {
  if (!props.children) {
    return <AnimationPlaceholder name="RotateIn 旋转" color="orange" />
  }
  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <RotateIn {...props} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

const WrappedBounceIn = (props: any) => {
  if (!props.children) {
    return <AnimationPlaceholder name="BounceIn 弹跳" color="pink" />
  }
  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <BounceIn {...props} />
      </Suspense>
    </AnimationErrorBoundary>
  )
}

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
  // Note: option is resolved inside EChartsComponent via resolveDataProp
  const { option, optionBase64, ...restProps } = props
  const formatters: { [key: string]: (...args: unknown[]) => unknown } = {}

  // 从option中提取函数配置 (only if option is a real object)
  const safeOption = option && typeof option === 'object'
    ? JSON.parse(JSON.stringify(option))
    : (optionBase64 ? undefined : {})

  return (
    <AnimationErrorBoundary>
      <Suspense fallback={<AnimationSkeleton />}>
        <EChartsComponent
          option={safeOption}
          optionBase64={optionBase64}
          formatters={formatters}
          {...restProps}
        />
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

type CodeElementProps = {
  className?: string
  children?: ReactNode
}

type PreWithABCProps = HTMLAttributes<HTMLPreElement> & {
  children?: ReactNode
}

function isABCCodeClassName(className?: string) {
  return className?.includes('language-abc') || className?.includes('lang-abc')
}

function getCodeChild(children: ReactNode): ReactElement<CodeElementProps> | null {
  const child = Children.toArray(children).find((item) => isValidElement<CodeElementProps>(item))

  return child && isValidElement<CodeElementProps>(child) ? child : null
}

function extractABCNotation(children: ReactNode) {
  if (typeof children === 'string') {
    return children.trim()
  }

  const codeChild = getCodeChild(children)
  const codeChildren = codeChild?.props.children

  if (typeof codeChildren === 'string') {
    return codeChildren.trim()
  }

  if (Array.isArray(codeChildren)) {
    return codeChildren.join('').trim()
  }

  return ''
}

function PreWithABC({ children, className }: PreWithABCProps) {
  const codeChild = getCodeChild(children)
  const codeClassName = codeChild?.props.className

  if (isABCCodeClassName(className) || isABCCodeClassName(codeClassName)) {
    return <ABCCodeBlock>{extractABCNotation(children)}</ABCCodeBlock>
  }

  return <CodeBlock className={codeClassName || className}>{children}</CodeBlock>
}

// MDX 组件映射，用于自定义 MDX 渲染
export const components = {
  Image,
  // TOCInline 在 MDX 内容中渲染底部目录，侧边栏已有 TOC，这里覆盖为空
  TOCInline: () => null,
  a: CustomLink,
  pre: PreWithABC,
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
  SheetMusic,
  ABCCodeBlock,
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
  BilibiliVideo,
  // Excalidraw 绘图组件
  excalidraw: ExcalidrawEmbed,
  // Gaussian Splatting 3D 渲染组件 (Spark 2.0, World Labs)
  GaussianSplat,
}
