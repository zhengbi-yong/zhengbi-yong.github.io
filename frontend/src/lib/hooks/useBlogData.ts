/**
 * Blog Data Fetching Hooks
 * React Query hooks for fetching blog data from the backend API
 */

import { useQuery } from '@tanstack/react-query'
import { backendApi } from '@/lib/api/backend'
import type {
  PostListParams,
} from '@/lib/types/backend'

// ==================== Posts ====================

/**
 * Fetch list of posts with pagination and filtering
 */
export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => backendApi.post.getPosts(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })
}

/**
 * Fetch single post by slug
 */
export function usePost(slug: string) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => backendApi.post.getPost(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!slug, // Only fetch if slug is provided
  })
}

/**
 * Fetch post statistics (views, likes, comments)
 */
export function usePostStats(slug: string) {
  return useQuery({
    queryKey: ['post-stats', slug],
    queryFn: () => backendApi.post.getStats(slug),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: !!slug,
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// ==================== Categories ====================

/**
 * Fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => backendApi.category.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Fetch category tree with subcategories
 */
export function useCategoryTree() {
  return useQuery({
    queryKey: ['category-tree'],
    queryFn: () => backendApi.category.getCategoryTree(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch single category by slug
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => backendApi.category.getCategory(slug),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!slug,
  })
}

// ==================== Tags ====================

/**
 * Fetch all tags
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => backendApi.tag.getTags(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch popular tags
 */
export function usePopularTags(limit = 20) {
  return useQuery({
    queryKey: ['popular-tags', limit],
    queryFn: () => backendApi.tag.getPopularTags(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Fetch single tag by slug
 */
export function useTag(slug: string) {
  return useQuery({
    queryKey: ['tag', slug],
    queryFn: () => backendApi.tag.getTag(slug),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!slug,
  })
}

// ==================== Search ====================

/**
 * Search posts
 */
export function useSearch(query: string, filters?: {
  category_slug?: string
  tag_slug?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => backendApi.search.search(query, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: query.length > 0, // Only search when there's a query
  })
}

/**
 * Search suggestions (autocomplete)
 */
export function useSearchSuggestions(query: string, limit = 5) {
  return useQuery({
    queryKey: ['search-suggestions', query, limit],
    queryFn: () => backendApi.search.getSuggestions(query, limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: query.length >= 2, // Only fetch when query has 2+ chars
  })
}

// ==================== Prefetch Helpers ====================

/**
 * Prefetch post data (useful for hover or preloading)
 */
export function usePrefetchPost() {
  const queryClient = useQueryClient()

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['post', slug],
      queryFn: () => backendApi.post.getPost(slug),
      staleTime: 5 * 60 * 1000,
    })
  }
}

import { useQueryClient } from '@tanstack/react-query'
