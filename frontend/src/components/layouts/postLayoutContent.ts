import type { Blog } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { PostDetail } from '@/lib/types/backend'

export type PostLayoutContent = CoreContent<Blog> | PostDetail

export interface ResolvedPostLayoutContent {
  slug: string
  path: string
  urlPath: string
  date: string
  title: string
  summary: string
  tags: string[]
  images: string[]
  categorySegment: string | null
}

function isPostDetail(content: PostLayoutContent): content is PostDetail {
  return 'created_at' in content && 'updated_at' in content
}

function normalizeTags(tags: PostLayoutContent['tags'] | undefined): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag
      }

      if (tag && typeof tag === 'object') {
        return tag.name || tag.slug || ''
      }

      return ''
    })
    .filter((tag): tag is string => tag.length > 0)
}

export function resolvePostLayoutContent(content: PostLayoutContent): ResolvedPostLayoutContent {
  const fallbackPath =
    'path' in content && typeof content.path === 'string' && content.path.length > 0
      ? content.path
      : `blog/${content.slug}`

  const slug =
    typeof content.slug === 'string' && content.slug.length > 0
      ? content.slug
      : fallbackPath.replace(/^blog\//, '')

  const path =
    'path' in content && typeof content.path === 'string' && content.path.length > 0
      ? content.path
      : slug

  const urlPath = path.startsWith('blog/') ? `/${path}` : `/blog/${slug}`
  const date =
    ('date' in content && typeof content.date === 'string' && content.date.length > 0
      ? content.date
      : undefined) ||
    (isPostDetail(content)
      ? content.published_at || content.updated_at || content.created_at
      : undefined) ||
    new Date().toISOString()

  const images =
    'images' in content && Array.isArray(content.images)
      ? content.images.filter(
          (image): image is string => typeof image === 'string' && image.length > 0
        )
      : isPostDetail(content) && content.cover_image_url
        ? [content.cover_image_url]
        : []

  return {
    slug,
    path,
    urlPath,
    date,
    title: content.title,
    summary: content.summary || '',
    tags: normalizeTags(content.tags),
    images,
    categorySegment: (isPostDetail(content) ? content.category_slug : null) || slug.split('/')[0] || null,
  }
}
