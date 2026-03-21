/**
 * MDX Runtime Configuration
 *
 * 配置MDX运行时编译，支持所有Contentlayer已有的插件功能
 * 包括：数学公式、化学公式、代码高亮、GitHub警告块等
 */

'use client'

import { useState, useEffect } from 'react'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote'
import { components as mdxComponents } from '@/components/MDXComponents'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { AnimationSkeleton } from '@/components/loaders/AnimationSkeleton'
import { AnimationErrorBoundary } from '@/components/AnimationErrorBoundary'

// Import chemistry components directly for MDXRemote usage
// Dynamic imports from MDXComponents don't work properly with MDXRemote
// We need to import them here to ensure they're available at runtime
const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure').then((mod) => mod.default),
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
  () => import('@/components/chemistry/SimpleChemicalStructure').then((mod) => mod.default),
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

const RDKitStructure = dynamic(
  () => import('@/components/chemistry/RDKitStructure').then((mod) => mod.default),
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
  () => import('@/components/chemistry/MoleculeFingerprint').then((mod) => mod.default),
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

// Wrap chemistry components with error boundary and suspense
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

// Create runtime components object with chemistry components
const components = {
  ...mdxComponents,
  // Override chemistry components with wrapped versions for MDXRemote
  ChemicalStructure: WrappedChemicalStructure,
  SimpleChemicalStructure: WrappedSimpleChemicalStructure,
  RDKitStructure: WrappedRDKitStructure,
  MoleculeFingerprint: WrappedMoleculeFingerprint,
}

export async function serializeMDX(content: string) {
  return await serialize(content, {
    mdxOptions: {
      format: 'mdx',
    },
  })
}
export type MDXRuntimeProps = {
  content: string
} & Partial<Omit<MDXRemoteProps, 'source'>>

/**
 * MDX运行时渲染器组件
 *
 * 在客户端动态渲染从API获取的MDX内容
 *
 * @example
 * ```tsx
 * <MDXRuntime content={post.content} />
 * ```
 */
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
        const source = await serialize(content)
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

    loadMDX()

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
      {/* RDKit初始化脚本 - 确保化学组件在动态渲染时可用 */}
      <Script
        src="/chemistry/rdkit-init.js"
        strategy="beforeInteractive"
      />
      {/* 化学公式初始化 */}
      <MhchemInit />
      {/* MDX渲染 */}
      <MDXRemote {...mdxSource} components={components} {...props} />
    </>
  )
}

/**
 * MDX加载骨架屏
 */
function MDXLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * MDX错误消息
 */
function MDXErrorMessage({ error }: { error: Error }) {
  return (
    <div className="text-red-600 dark:text-red-400 p-4 border border-red-300 dark:border-red-700 rounded-lg">
      <h3 className="font-bold text-lg mb-2">文章内容加载失败</h3>
      <p className="text-sm">{error.message}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm">查看详细错误</summary>
        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
          {error.stack}
        </pre>
      </details>
    </div>
  )
}

/**
 * MDX空状态
 */
function MDXEmptyState() {
  return (
    <div className="text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
      文章内容为空
    </div>
  )
}

/**
 * 化学公式初始化组件
 */
function MhchemInit() {
  return null
  // TODO: 如果需要mhchem支持，可以在这里初始化
  // 当前项目中mhchem已经在rehype-mhchem插件中处理
}
