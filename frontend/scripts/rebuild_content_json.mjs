/**
 * rebuild_content_json.mjs
 * 
 * Rebuild all content_json from original MDX files using BlockNote's
 * tryParseMarkdownToBlocks(). This ensures headings, code blocks,
 * tables, lists, and all other block types are in the correct format.
 * 
 * Usage:
 *   pnpm rebuild:content-json
 *   
 * Or directly:
 *   node scripts/rebuild_content_json.mjs
 */

import { readFileSync } from 'fs'
import { globSync } from 'glob'
import { basename, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import matter from 'gray-matter'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

// PostgreSQL connection from env (same as API)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://blog_user:blog_password@localhost:5432/blog_db'

// BlockNote editor factory for markdown parsing
// This is a lightweight approach: we create a temporary editor instance
// to leverage tryParseMarkdownToBlocks without needing a full React tree.
async function parseMarkdownToBlocks(markdown) {
  // Use BlockNote's server-side markdown parser
  // We import dynamically to avoid bundling issues
  const { serverBlockNote } = await import('@blocknote/server-util')
  
  return serverBlockNote.markdownToBlocks(markdown)
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL })
  
  try {
    // Get all posts with MDX content
    const { rows: posts } = await pool.query(
      `SELECT id, slug, content_mdx, title FROM posts WHERE content_mdx IS NOT NULL AND content_mdx != ''`
    )
    
    console.log(`Found ${posts.length} posts with MDX content\n`)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const post of posts) {
      try {
        // Pre-process MDX: wrap JSX component names in backticks to avoid 
        // BlockNote trying to parse them as HTML
        let mdx = post.content_mdx
        
        // Replace known JSX components with escaped versions
        // BlockNote's markdown parser handles standard markdown fine,
        // but JSX can confuse it. We'll preserve JSX in the output.
        const jsxBlockRegex = /<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?\/>/g
        mdx = mdx.replace(jsxBlockRegex, '`<$1$2/>`')
        
        const jsxOpenRegex = /<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g
        mdx = mdx.replace(jsxOpenRegex, '`<$1$2>`')
        
        const jsxCloseRegex = /<\/([A-Z][a-zA-Z0-9]*)>/g
        mdx = mdx.replace(jsxCloseRegex, '`</$1>`')
        
        // Parse markdown to blocks
        const blocks = await parseMarkdownToBlocks(mdx)
        
        // Update the database
        await pool.query(
          `UPDATE posts SET content_json = $1 WHERE id = $2`,
          [JSON.stringify(blocks), post.id]
        )
        
        updated++
        const headingCount = blocks.filter(b => b.type === 'heading').length
        const codeBlockCount = blocks.filter(b => b.type === 'codeBlock').length
        const tableCount = blocks.filter(b => b.type === 'table').length
        
        const parts = [`${blocks.length} blocks`]
        if (headingCount > 0) parts.push(`${headingCount} headings`)
        if (codeBlockCount > 0) parts.push(`${codeBlockCount} codeBlocks`)
        if (tableCount > 0) parts.push(`${tableCount} tables`)
        
        console.log(`✅ ${post.slug.padEnd(40)} ${parts.join(', ')}`)
      } catch (err) {
        errors++
        console.error(`❌ ${post.slug}: ${err.message}`)
      }
    }
    
    console.log(`\n=== Summary ===`)
    console.log(`Updated: ${updated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Errors:  ${errors}`)
    
  } finally {
    await pool.end()
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
