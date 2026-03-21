#!/usr/bin/env node

/**
 * MDX to Database Migration Script
 *
 * Migrates all MDX blog files from frontend/data/blog/ to the database
 * This script requires the backend API to be running
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const MDX_DIR = path.join(process.cwd(), '../frontend/data/blog')
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/v1'
const API_URL = `${BACKEND_URL}/admin/posts`

// Category mapping from MDX directory structure
const categoryMap = {
  'chemistry': 'chemistry',
  'computer': 'computer-science',
  'robotics': 'robotics',
  'photography': 'photography',
  'motor': 'motor-control',
  'music': 'music',
  'tactile': 'tactile-sensing',
  'control': 'computer-science',
  'economics': 'social',
}

/**
 * Extract category from file path
 */
function getCategoryFromPath(filePath: string): string {
  const parts = filePath.split(path.sep)
  const categoryFolder = parts[parts.length - 2] // Second to last folder

  if (categoryFolder && categoryMap[categoryFolder]) {
    return categoryMap[categoryFolder]
  }

  return 'computer-science' // Default category
}

/**
 * Fetch category slug from API
 */
async function getCategoryId(categoryName: string): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/categories`)
    if (!response.ok) {
      console.warn(`Failed to fetch categories for ${categoryName}`)
      return null
    }

    const data = await response.json()
    const category = data.categories?.find((c: any) => c.slug === categoryName)

    return category?.id || null
  } catch (error) {
    console.error(`Error fetching category ${categoryName}:`, error)
    return null
  }
}

/**
 * Check if post already exists
 */
async function postExists(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/posts/${slug}`)
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * Migrate a single MDX file
 */
async function migrateFile(filePath: string, fileName: string): Promise<void> {
  try {
    // Read MDX file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    // Extract slug from filename
    const slug = fileName.replace(/\.mdx?$/i, '')

    // Check if post already exists
    if (await postExists(slug)) {
      console.log(`⏭  Skipping ${slug} - already exists in database`)
      return
    }

    // Get category
    const categoryName = getCategoryFromPath(filePath)
    const categoryId = await getCategoryId(categoryName)

    // Prepare post data
    const postData = {
      slug,
      title: data.title || 'Untitled Post',
      content, // MDX content
      summary: data.summary || data.description || '',
      status: 'Published',
      published_at: data.date || new Date().toISOString(),
      category_id: categoryId,
      show_toc: data.showTOC !== undefined ? data.showTOC : true,
      layout: data.layout || 'PostLayout',
      meta_title: data.title || '',
      meta_description: data.summary || data.description || '',
      canonical_url: data.canonicalUrl || '',
      tag_slugs: data.tags || [],
      content_format: 'mdx',
      post_type: 'article',
      language: 'zh-CN',
    }

    // Send to API
    console.log(`📝 Migrating: ${slug}`)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you need to add authentication headers
        // 'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create post ${slug}: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Migrated: ${slug}`)

  } catch (error) {
    console.error(`❌ Failed to migrate ${fileName}:`, error)
  }
}

/**
 * Get all MDX files recursively
 */
function getAllMdxFiles(dir: string): string[] {
  const files: string[] = []

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath))
    } else if (item.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting MDX to Database Migration')
  console.log(`📂 MDX Directory: ${MDX_DIR}`)

  // Check if directory exists
  if (!fs.existsSync(MDX_DIR)) {
    console.error(`❌ MDX directory not found: ${MDX_DIR}`)
    process.exit(1)
  }

  // Get all MDX files
  const files = getAllMdxFiles(MDX_DIR)
  console.log(`📊 Found ${files.length} MDX files`)

  if (files.length === 0) {
    console.log('✅ No MDX files to migrate')
    return
  }

  // Migrate each file
  let successCount = 0
  let failCount = 0

  for (const filePath of files) {
    const fileName = path.basename(filePath)
    await migrateFile(filePath, fileName)

    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))

    if (filePath.includes('robotics') || filePath.includes('chemistry')) {
      successCount++
    } else {
      successCount++
    }
  }

  // Summary
  console.log('\n========================================')
  console.log('📊 Migration Summary')
  console.log('========================================')
  console.log(`Total files: ${files.length}`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('========================================\n')

  if (failCount > 0) {
    console.error('⚠️  Some posts failed to migrate. Please check the logs above.')
    process.exit(1)
  } else {
    console.log('✅ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Start your backend server: cargo run')
    console.log('2. Visit your blog: http://localhost:3001')
    console.log('3. Verify posts are loading from database')
  }
}

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
