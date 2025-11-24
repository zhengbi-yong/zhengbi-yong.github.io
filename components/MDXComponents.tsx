import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import AnimatedSection from './AnimatedSection'
import AnimatedList from './AnimatedList'
import FadeIn from './animations/FadeIn'
import SlideIn from './animations/SlideIn'
import ScaleIn from './animations/ScaleIn'

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
  // Framer Motion 动画组件
  FadeIn,
  SlideIn,
  ScaleIn,
}
