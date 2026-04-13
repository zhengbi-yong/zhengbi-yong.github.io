/**
 * Pliny contentlayer utilities compatibility shim
 *
 * This module provides shimmed exports that mimic pliny's contentlayer utilities,
 * adapted for use with Velite-generated data.
 */

/**
 * A typesafe pick helper function
 */
export function pick<Obj, Keys extends keyof Obj>(obj: Obj, keys: Keys[]): { [K in Keys]: Obj[K] } {
  const result = {} as { [K in Keys]: Obj[K] }
  for (const key of keys) {
    result[key] = obj[key]
  }
  return result
}

/**
 * A typesafe omit helper function
 */
export function omit<Obj, Keys extends keyof Obj>(obj: Obj, keys: Keys[]): Omit<Obj, Keys> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * CoreContent - omits body, _raw, _id from document
 * For Velite data, we omit 'body' (which is an artificial field we added)
 */
export type CoreContent<T> = Omit<T, 'body' | '_raw' | '_id'>

/**
 * Omit body, _raw, _id from MDX document and return only the core content
 */
export function coreContent<T extends { body?: unknown; _raw?: unknown; _id?: unknown }>(
  content: T
): CoreContent<T> {
  return omit(content, ['body', '_raw', '_id'] as any)
}

/**
 * MDXDocument base type
 */
export interface MDXDocument {
  _id: string
  _raw: {
    sourceFilePath: string
  }
  body: { code: string }
}

/**
 * MDXDocument with date
 */
export type MDXDocumentDate = MDXDocument & {
  date: string
}

/**
 * MDXBlog post
 */
export type MDXBlog = MDXDocumentDate & {
  tags?: string[]
  draft?: boolean
}

/**
 * MDXAuthor
 */
export type MDXAuthor = MDXDocument & {
  name: string
}

/**
 * Date comparison function for sorting (descending)
 */
export function dateSortDesc(a: string, b: string): 1 | 0 | -1 {
  const dateA = new Date(a).getTime()
  const dateB = new Date(b).getTime()
  if (dateA > dateB) return -1
  if (dateA < dateB) return 1
  return 0
}

/**
 * Sorts a list of MDX documents by date in descending order
 */
export function sortPosts<T extends MDXDocumentDate>(allBlogs: T[], dateKey: string = 'date'): T[] {
  return [...allBlogs].sort((a, b) => {
    const dateA = new Date((a as any)[dateKey] as string).getTime()
    const dateB = new Date((b as any)[dateKey] as string).getTime()
    return dateB - dateA
  })
}

/**
 * Kept for backwards compatibility
 * @deprecated Use sortPosts instead
 */
export function sortedBlogPost(allBlogs: MDXDocumentDate[]): MDXDocumentDate[] {
  return sortPosts(allBlogs)
}

/**
 * Omit body, _raw, _id from a list of MDX documents and returns only the core content
 * If NODE_ENV === "production", it will also filter out any documents with draft: true.
 */
export function allCoreContent<T extends MDXDocument>(contents: T[]): CoreContent<T>[] {
  const isProduction = process.env.NODE_ENV === 'production'
  return contents
    .filter((content) => {
      if (isProduction && 'draft' in content && content.draft === true) {
        return false
      }
      return true
    })
    .map((content) => coreContent(content) as CoreContent<T>)
}

// Re-export types for convenience
// CoreContent is already exported via the type definition above
