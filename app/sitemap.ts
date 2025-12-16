import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl

  // Get all blog posts
  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // Get all unique tags
  const tags = [...new Set(allBlogs.flatMap((post) => post.tags || []))]
  const tagRoutes = tags.map((tag) => ({
    url: `${siteUrl}/tags/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Get all categories (using tag as category)
  const categories = [...new Set(allBlogs.flatMap((post) => post.tags || []))]
  const categoryRoutes = categories.map((category) => ({
    url: `${siteUrl}/blog/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Static main routes
  const mainRoutes = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/music`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/experiment`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
    {
      url: `${siteUrl}/visitors`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    },
    {
      url: `${siteUrl}/excalidraw`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]

  // Combine all routes
  const allRoutes = [...mainRoutes, ...blogRoutes, ...tagRoutes, ...categoryRoutes]

  // Add pagination for blog
  const postsPerPage = 10
  const totalPages = Math.ceil(allBlogs.filter((post) => !post.draft).length / postsPerPage)
  for (let page = 2; page <= totalPages; page++) {
    allRoutes.push({
      url: `${siteUrl}/blog/page/${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })
  }

  // Add pagination for tags
  tags.forEach((tag) => {
    const tagPosts = allBlogs.filter((post) => !post.draft && post.tags?.includes(tag))
    const tagPages = Math.ceil(tagPosts.length / postsPerPage)
    for (let page = 2; page <= tagPages; page++) {
      allRoutes.push({
        url: `${siteUrl}/tags/${tag}/page/${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      })
    }
  })

  return allRoutes
}
