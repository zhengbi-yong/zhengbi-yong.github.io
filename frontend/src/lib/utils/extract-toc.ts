/**
 * Extract Table of Contents from markdown/MDX content
 * Uses Fumadocs' remark-heading pipeline for proper heading parsing,
 * github-slugger for ID generation, and MDX-aware AST traversal.
 */

import { getTableOfContents } from 'fumadocs-core/content/toc'
import type { TOC } from '@/lib/types/toc'

/**
 * Extract TOC items from markdown/MDX content using Fumadocs' remark pipeline.
 * Uses github-slugger for heading ID generation — handles Chinese, emoji,
 * and special characters correctly (matching Fumadocs DocsPage TOC).
 *
 * Only includes h1 (depth 1) and h2 (depth 2) headings.
 */
export function extractTocFromContent(content: string): TOC {
  if (!content) return []

  const allItems = getTableOfContents(content)

  // Filter to only h1 and h2 (matching Fumadocs docs TOC convention)
  return allItems.filter((item) => item.depth <= 2)
}
