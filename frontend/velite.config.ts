import { defineConfig, defineCollection, s } from 'velite'
import { slug } from 'github-slugger'
import readingTime from 'reading-time'

// Custom slug generator using github-slugger
function slugify(text: string): string {
  return slug(text)
}

const blog = defineCollection({
  name: 'Blog',
  pattern: 'blog/**/*.mdx',
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    tags: s.array(s.string()).optional(),
    category: s.string().optional(),
    lastmod: s.isodate().optional(),
    draft: s.boolean().optional(),
    summary: s.string().optional(),
    images: s.array(s.string()).optional(),
    authors: s.array(s.string()).optional(),
    layout: s.string().optional(),
    bibliography: s.string().optional(),
    canonicalUrl: s.string().optional(),
    showTOC: s.boolean().optional(),
    author: s.string().optional(),
    description: s.string().optional(),
    math: s.boolean().optional(),
    categories: s.array(s.string()).optional(),
    content: s.markdown(),
  }),
  transform: (item) => {
    const blogSlug = item._raw.sourceFilePath.replace(/^blog\//, '').replace(/\.mdx$/, '')
    return {
      ...item,
      slug: slugify(blogSlug),
      path: item._raw.sourceFilePath.replace(/\.mdx$/, ''),
      filePath: item._raw.sourceFilePath,
      readingTime: readingTime(item.content || '').text,
    }
  },
})

const authors = defineCollection({
  name: 'Authors',
  pattern: 'authors/**/*.mdx',
  schema: s.object({
    name: s.string(),
    avatar: s.string().optional(),
    occupation: s.string().optional(),
    company: s.string().optional(),
    email: s.string().optional(),
    twitter: s.string().optional(),
    bluesky: s.string().optional(),
    linkedin: s.string().optional(),
    github: s.string().optional(),
    layout: s.string().optional(),
    content: s.markdown(),
  }),
  transform: (item) => {
    return {
      ...item,
      slug: slugify(
        item.name || item._raw.sourceFilePath.replace(/^authors\//, '').replace(/\.mdx$/, '')
      ),
    }
  },
})

export default defineConfig({
  root: './data',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: {
    blog,
    authors,
  },
})
