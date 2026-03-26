import type { PostListItem } from '@/lib/types/backend'

export interface BlogLikePost {
  slug: string
  path: string
  title: string
  summary: string
  date: string
  tags: string[]
  images: string[]
}

export function toBlogLikePost(post: PostListItem): BlogLikePost {
  return {
    slug: post.slug,
    path: `blog/${post.slug}`,
    title: post.title,
    summary: post.summary || '',
    date: post.published_at || post.created_at,
    tags: post.category_name ? [post.category_name] : [],
    images: post.cover_image_url ? [post.cover_image_url] : [],
  }
}
