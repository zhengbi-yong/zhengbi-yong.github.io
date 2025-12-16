#!/usr/bin/env node

/**
 * Auto-generate Storybook stories for React components
 * This script helps create basic story files for components that don't have them yet
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Components directory
const componentsDir = path.join(__dirname, '../components')
const storiesDir = path.join(__dirname, '../stories')

// Get all component files
function getComponentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getComponentFiles(filePath, fileList)
    } else if (file.endsWith('.tsx') && !file.includes('.stories.')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Get component name from file path
function getComponentName(filePath) {
  const relativePath = path.relative(componentsDir, filePath)
  const parsed = path.parse(relativePath)
  return parsed.name
}

// Get story path from component path
function getStoryPath(componentPath) {
  const relativePath = path.relative(componentsDir, componentPath)
  const parsed = path.parse(relativePath)
  return path.join(storiesDir, parsed.dir, `${parsed.name}.stories.tsx`)
}

// Generate basic story template
function generateStoryTemplate(componentName, filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

  return `import type { Meta, StoryObj } from '@storybook/react'
import ${componentName} from '@/${relativePath}'

const meta: Meta<typeof ${componentName}> = {
  title: '${getCategory(relativePath)}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
`
}

// Get category from path
function getCategory(relativePath) {
  const dir = path.dirname(relativePath)
  if (dir === '.') return 'Components'

  // Map directories to categories
  const categoryMap = {
    ui: 'UI',
    animations: 'Animations',
    hooks: 'Hooks',
    layouts: 'Layouts',
    sections: 'Sections',
    header: 'Navigation',
    footer: 'Layout',
    book: 'Features',
    experiments: 'Experiments',
    home: 'Home',
    debug: 'Development',
  }

  return categoryMap[dir.split('/')[0]] || dir.split('/')[0]
}

// Main function
async function generateStories() {
  console.log('📚 Generating Storybook stories...')

  const componentFiles = getComponentFiles(componentsDir)
  let generatedCount = 0
  let skippedCount = 0

  for (const componentFile of componentFiles) {
    const componentName = getComponentName(componentFile)
    const storyPath = getStoryPath(componentFile)

    // Skip certain components
    if (
      componentName.startsWith('index') ||
      componentName === 'lib' ||
      componentName.includes('.example') ||
      componentName.includes('.test') ||
      componentName.includes('.spec')
    ) {
      continue
    }

    // Skip if story already exists
    if (fs.existsSync(storyPath)) {
      skippedCount++
      continue
    }

    // Create directory if it doesn't exist
    const storyDir = path.dirname(storyPath)
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true })
    }

    // Write story file
    const template = generateStoryTemplate(componentName, componentFile)
    fs.writeFileSync(storyPath, template, 'utf8')

    console.log(`✅ Generated story for ${componentName}`)
    generatedCount++
  }

  console.log(
    `\n✨ Done! Generated ${generatedCount} stories, skipped ${skippedCount} existing stories.`
  )
  console.log('\n📝 Next steps:')
  console.log('1. Run: pnpm storybook')
  console.log('2. Review and customize the generated stories')
  console.log('3. Add more comprehensive examples and documentation')
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStories().catch(console.error)
}

export { generateStories }
