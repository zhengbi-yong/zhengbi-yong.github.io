'use client'

import { useEffect, useState, Suspense } from 'react'
import { compile } from '@mdx-js/mdx'
import { VFile } from 'vfile'
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import { components as mdxComponents } from '@/components/MDXComponents'
import { AnimationSkeleton } from '@/components/loaders/AnimationSkeleton'
import { AnimationErrorBoundary } from '@/components/AnimationErrorBoundary'
import { normalizeRuntimeMdxContent } from './mdx-runtime-normalize'
import { KatexRenderer } from '@/components/KatexRenderer'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkHeading } from 'fumadocs-core/mdx-plugins/remark-heading'
import rehypeKatex from 'rehype-katex'
import rehypeMhchem from './rehype-mhchem'
import type { TOCItemType } from 'fumadocs-core/toc'

// Import KaTeX CSS
import 'katex/dist/katex.min.css'

const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading 3D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const SimpleChemicalStructure = dynamic(
  () => import('@/components/chemistry/SimpleChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading 3D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const RDKitStructure = dynamic(
  () => import('@/components/chemistry/RDKitStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-border dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading 2D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const MoleculeFingerprint = dynamic(
  () => import('@/components/chemistry/MoleculeFingerprint').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 items-center justify-center rounded-lg border border-dashed border-border p-4 dark:border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-6 w-6 animate-spin rounded-full border-4 border-border" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Loading molecular fingerprint...
          </p>
        </div>
      </div>
    ),
  }
)

const WrappedChemicalStructure = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <ChemicalStructure {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedSimpleChemicalStructure = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <SimpleChemicalStructure {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedRDKitStructure = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <RDKitStructure {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedMoleculeFingerprint = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <MoleculeFingerprint {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const components = {
  ...mdxComponents,
  ChemicalStructure: WrappedChemicalStructure,
  SimpleChemicalStructure: WrappedSimpleChemicalStructure,
  RDKitStructure: WrappedRDKitStructure,
  MoleculeFingerprint: WrappedMoleculeFingerprint,
  KatexRenderer: KatexRenderer, // 数学公式渲染组件
}

/**
 * MDX 编译结果
 * - source: 可传给 MDXRemote 的编译结果
 * - toc: remarkHeading 在同一次编译中提取的 TOC（与 heading ID 同源，保证一致）
 */
export interface MDXCompileResult {
  compiledSource: string
  toc: TOCItemType[]
}

export type MDXRuntimeProps = {
  content: string
  /** Fumadocs 方式：编译完成后回调，传递 TOC（与 heading ID 同一管线提取） */
  onCompiled?: (result: MDXCompileResult) => void
} & Partial<Omit<MDXRemoteProps, 'source'>>

export function MDXRuntime({ content, onCompiled, ...props }: MDXRuntimeProps) {
  const [mdxSource, setMdxSource] = useState<{ compiledSource: string; frontmatter?: Record<string, unknown> } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMDX() {
      try {
        setIsLoading(true)
        setError(null)

        const normalized = normalizeRuntimeMdxContent(content)

        // Fumadocs 方式：用 @mdx-js/mdx 的 compile() 代替 next-mdx-remote 的 serialize()
        // remarkHeading 在编译时将 TOC 写入 vfile.data.toc，保证与 heading ID 完全一致
        const vfile = new VFile(normalized)

        const compiled = await compile(vfile, {
          remarkPlugins: [remarkGfm, remarkMath, remarkHeading],
          rehypePlugins: [rehypeMhchem, rehypeKatex],
          outputFormat: 'function-body',
          providerImportSource: '@mdx-js/react',
          development: false,
        })

        // remarkHeading 把 TOC 存在 vfile.data.toc
        const toc = (vfile.data.toc as TOCItemType[]) || []

        if (onCompiled) {
          onCompiled({ compiledSource: String(compiled), toc })
        }

        if (!cancelled) {
          setMdxSource({ compiledSource: String(compiled) })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadMDX()

    return () => {
      cancelled = true
    }
  }, [content]) // onCompiled intentionally excluded — stable callback

  if (isLoading) {
    return <MDXLoadingSkeleton />
  }

  if (error) {
    return <MDXErrorMessage error={error} />
  }

  if (!mdxSource) {
    return <MDXEmptyState />
  }

  return <MDXRemote {...mdxSource} components={components} {...props} />
}

// Note: uses <span> not <div> to avoid hydration errors when MDXLoadingSkeleton
// renders inside a <p> tag (e.g., inline summary text with KaTeX)
function MDXLoadingSkeleton() {
  return (
    <span className="animate-pulse inline-flex flex-col gap-1">
      <span className="inline-block h-6 w-48 rounded bg-gray-200 dark:bg-secondary align-middle"></span>
      <span className="inline-flex flex-col gap-1">
        <span className="inline-block h-4 w-72 rounded bg-gray-200 dark:bg-secondary align-middle"></span>
        <span className="inline-block h-4 w-60 rounded bg-gray-200 dark:bg-secondary align-middle"></span>
      </span>
    </span>
  )
}

function MDXErrorMessage({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-destructive/30 p-4 text-destructive dark:border-destructive/15 dark:text-destructive">
      <h3 className="mb-2 text-lg font-bold">Failed to load article content</h3>
      <p className="text-sm">{error.message}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm">Show stack trace</summary>
        <pre className="mt-2 overflow-auto rounded bg-secondary p-2 text-xs dark:bg-card">
          {error.stack}
        </pre>
      </details>
    </div>
  )
}

function MDXEmptyState() {
  return (
    <div className="rounded-lg border border-border p-4 text-muted-foreground dark:border-border dark:text-muted-foreground">
      Article content is empty.
    </div>
  )
}
