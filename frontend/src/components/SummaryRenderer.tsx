'use client'

/**
 * SummaryRenderer — 统一正文与摘要的渲染管线
 *
 * 策略：摘要完全复用 MDXRuntime，与正文共用同一套：
 *   normalizeRuntimeMdxContent() → serialize() → MDXRemote + 完整 components
 *
 * 这确保：
 *   - KaTeX 数学公式 ($...$ / $$...$$) 渲染一致
 *   - RDKitStructure、MoleculeFingerprint 等化学组件在摘要中可用
 *   - 图表、乐谱、动画等所有 MDX 组件统一支持
 *
 * 弃用的旧方案：纯 katex.renderToString() 正则替换，仅支持 KaTeX，
 *             不支持其他 MDX 组件，渲染管线与正文不一致。
 */

import { MDXRuntime } from '@/lib/mdx-runtime'

interface SummaryRendererProps {
  summary: string
}

export function SummaryRenderer({ summary }: SummaryRendererProps) {
  return <MDXRuntime content={summary} />
}
