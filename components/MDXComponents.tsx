import dynamic from 'next/dynamic'
import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import AnimatedSection from './AnimatedSection'
import AnimatedList from './AnimatedList'

// 动态导入动画组件，减少初始 bundle 大小
// 注意：在 Server Component 中不能使用 ssr: false，但这些组件本身已经是 Client Components
const FadeIn = dynamic(() => import('./animations/FadeIn').then((mod) => mod.default))

const SlideIn = dynamic(() => import('./animations/SlideIn').then((mod) => mod.default))

const ScaleIn = dynamic(() => import('./animations/ScaleIn').then((mod) => mod.default))

const RotateIn = dynamic(() => import('./animations/RotateIn').then((mod) => mod.default))

const BounceIn = dynamic(() => import('./animations/BounceIn').then((mod) => mod.default))

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
  // Framer Motion 动画组件（动态导入，按需加载）
  FadeIn,
  SlideIn,
  ScaleIn,
  RotateIn,
  BounceIn,
}
