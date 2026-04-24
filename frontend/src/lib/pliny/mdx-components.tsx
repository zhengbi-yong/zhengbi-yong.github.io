/**
 * Pliny MDX components compatibility shim
 *
 * This module provides shimmed exports that mimic pliny's mdx-* adapted for use with Velite-generated data.
 *
 * Velite stores content as pre-rendered HTML, while pliny expects raw MDX code.
 * This shim renders HTML directly instead of compiling MDX.
 */

import { Fragment } from 'react'

interface MDXLayoutRendererProps {
  code: string
  components?: Record<string, React.ComponentType<any>>
  componentsPath?: string
  [key: string]: unknown
}

/**
 * Simplified MDX renderer that displays pre-rendered HTML content
 * from Velite. This is a compatibility shim - proper MDX compilation
 * would require additional setup.
 */
export function MDXLayoutRenderer({ code, ...props }: MDXLayoutRendererProps) {
  // Velite stores HTML content in the 'code' field (despite the name)
  // Render it directly using dangerouslySetInnerHTML
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: code }}
      {...props}
    />
  )
}

// Re-export Fragment for compatibility
export { Fragment }
