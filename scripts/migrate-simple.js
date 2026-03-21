#!/usr/bin/env node

/**
 * MDX to Database Migration Script (Simple Version)
 *
 * Simple MDX parsing without external dependencies
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const MDX_DIR = path.join(__dirname, '../frontend/data/blog')
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/v1'
const API_URL = `${BACKEND_URL}/admin/posts`

// Simple frontmatter parser (regex-based)
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { data: {}, content }
  }

  const [, frontmatterStr, body] = match

  // Parse YAML frontmatter
  const data = {}
  const lines = frontmatterStr.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''))
      }

      data[key] = value
    }
  }

  return { data, content: body }
}

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

function getCategoryFromPath(filePath) {
  const parts = filePath.split(path.sep)
  const categoryFolder = parts[parts.length - 2] // Second to last folder

  if (categoryFolder && categoryMap[categoryFolder]) {
    return categoryMap[categoryFolder]
  }

  return 'computer-science' // Default category
}

async function getCategoryId(categoryName) {
  try {
    const response = await fetch(`${BACKEND_URL}/categories`)
    if (!response.ok) {
      console.warn(`Failed to fetch categories for ${categoryName}`)
      return null
    }

    const data = await response.json()
    const category = data.categories?.find(c => c.slug === categoryName)

    return category ? category.id : null
  } catch (error) {
    console.error(`Error fetching category ${categoryName}:`, error)
    return null
  }
}

async function postExists(slug) {
  try {
    const response = await fetch(`${BACKEND_URL}/posts/${slug}`)
    return response.ok
  } catch (error) {
    return false
  }
}

async function migrateFile(filePath, fileName) {
  try {
    // Read MDX file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = parseFrontmatter(fileContent)

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
      category_id: categoryId, // Will be null if category not found
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

function getAllMdxFiles(dir) {
  const files = []

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

  for (const filePath of files) {
    const fileName = path.basename(filePath)
    await migrateFile(filePath, fileName)

    // Add small delay to avoid overwhelming API
    await new Promise(resolve => setTimeout(resolve, 200))

    successCount++
  }

  // Summary
  console.log('\n========================================')
  console.log('📊 Migration Summary')
  console.log('========================================')
  console.log(`Total files: ${files.length}`)
  console.log(`✅ Success: ${successCount}`)
  console.log('========================================\n')

  console.log('✅ Migration completed successfully!')
  console.log('\nNext steps:')
  console.log('1. Visit your blog: http://localhost:3001')
  console.log('2. Click on any post to verify it loads from database')
  console.log('3. Check if chemistry components render correctly')
}

main().catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
