'use client'

import { useEffect, useState, Suspense } from 'react'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import { components as mdxComponents } from '@/components/MDXComponents'
import { AnimationSkeleton } from '@/components/loaders/AnimationSkeleton'
import { AnimationErrorBoundary } from '@/components/AnimationErrorBoundary'
import { normalizeRuntimeMdxContent } from './mdx-runtime-normalize'
import { KatexRenderer } from '@/components/KatexRenderer'

// Import KaTeX CSS
import 'katex/dist/katex.min.css'

const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading 3D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const SimpleChemicalStructure = dynamic(
  () => import('@/components/chemistry/SimpleChemicalStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading 3D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const RDKitStructure = dynamic(
  () => import('@/components/chemistry/RDKitStructure').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading 2D structure viewer...</p>
        </div>
      </div>
    ),
  }
)

const MoleculeFingerprint = dynamic(
  () => import('@/components/chemistry/MoleculeFingerprint').then((mod) => mod.default),
  {
    loading: () => (
      <div className="my-6 items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="border-t-primary-500 h-6 w-6 animate-spin rounded-full border-4 border-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading molecular fingerprint...</p>
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
  KatexRenderer: KatexRenderer,  // 数学公式渲染组件
}

export async function serializeMDX(content: string) {
  console.log('[serializeMDX] Input content:', content.substring(0, 100))

  // 暂时移除 KaTeX 插件，先让基本功能工作
  const result = await serialize(content, {
    mdxOptions: {
      format: 'mdx',
      // 暂时不使用插件
      remarkPlugins: [],
      rehypePlugins: [],
    },
  })

  console.log('[serializeMDX] Serialized successfully')
  return result
}

export type MDXRuntimeProps = {
  content: string
} & Partial<Omit<MDXRemoteProps, 'source'>>

export function MDXRuntime({ content, ...props }: MDXRuntimeProps) {
  const [mdxSource, setMdxSource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMDX() {
      try {
        setIsLoading(true)
        setError(null)
        const source = await serialize(normalizeRuntimeMdxContent(content))
        if (!cancelled) {
          setMdxSource(source)
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
  }, [content])

  if (isLoading) {
    return <MDXLoadingSkeleton />
  }

  if (error) {
    return <MDXErrorMessage error={error} />
  }

  if (!mdxSource) {
    return <MDXEmptyState />
  }

  return (
    <>
      <MhchemInit />
      <MDXRemote {...mdxSource} components={components} {...props} />
    </>
  )
}

function MDXLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="space-y-2">
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  )
}

function MDXErrorMessage({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-300 p-4 text-red-600 dark:border-red-700 dark:text-red-400">
      <h3 className="mb-2 text-lg font-bold">Failed to load article content</h3>
      <p className="text-sm">{error.message}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm">Show stack trace</summary>
        <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
          {error.stack}
        </pre>
      </details>
    </div>
  )
}

function MDXEmptyState() {
  return (
    <div className="rounded-lg border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
      Article content is empty.
    </div>
  )
}

function MhchemInit() {
  return null
}
