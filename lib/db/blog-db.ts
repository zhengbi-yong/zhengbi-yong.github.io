/**
 * IndexedDB 数据库操作
 * 用于缓存博客数据，提升后续访问速度
 */

import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

const DB_NAME = 'blog-db'
const DB_VERSION = 1

const STORES = {
  BLOGS: 'blogs',
  POSTS: 'posts',
  METADATA: 'metadata',
}

interface BlogDB {
  db: IDBDatabase | null
  init: () => Promise<void>
  saveBlogs: (blogs: CoreContent<Blog>[]) => Promise<void>
  getBlogs: () => Promise<CoreContent<Blog>[] | null>
  savePost: (slug: string, content: any) => Promise<void>
  getPost: (slug: string) => Promise<any | null>
  clearCache: () => Promise<void>
}

/**
 * 检查浏览器是否支持 IndexedDB
 */
function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

/**
 * 打开数据库
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      reject(new Error('IndexedDB is not supported'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建 blogs store
      if (!db.objectStoreNames.contains(STORES.BLOGS)) {
        const blogsStore = db.createObjectStore(STORES.BLOGS, { keyPath: 'path' })
        blogsStore.createIndex('date', 'date', { unique: false })
      }

      // 创建 posts store
      if (!db.objectStoreNames.contains(STORES.POSTS)) {
        db.createObjectStore(STORES.POSTS, { keyPath: 'slug' })
      }

      // 创建 metadata store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
      }
    }
  })
}

const blogDB: BlogDB = {
  db: null,

  /**
   * 初始化数据库
   */
  async init() {
    if (!isIndexedDBSupported()) {
      console.debug('[IndexedDB] IndexedDB not supported')
      return
    }

    try {
      this.db = await openDB()
      console.log('[IndexedDB] Database initialized')
    } catch (error) {
      console.error('[IndexedDB] Failed to initialize database:', error)
    }
  },

  /**
   * 保存博客列表
   */
  async saveBlogs(blogs: CoreContent<Blog>[]) {
    if (!this.db || !isIndexedDBSupported()) {
      return
    }

    try {
      const transaction = this.db.transaction([STORES.BLOGS], 'readwrite')
      const store = transaction.objectStore(STORES.BLOGS)

      // 清空现有数据
      await store.clear()

      // 保存新数据
      for (const blog of blogs) {
        await store.put(blog)
      }

      // 更新元数据
      const metadataTransaction = this.db.transaction([STORES.METADATA], 'readwrite')
      const metadataStore = metadataTransaction.objectStore(STORES.METADATA)
      await metadataStore.put({
        key: 'blogs-cached-at',
        value: Date.now(),
      })

      console.log('[IndexedDB] Blogs saved:', blogs.length)
    } catch (error) {
      console.error('[IndexedDB] Failed to save blogs:', error)
    }
  },

  /**
   * 获取博客列表
   */
  async getBlogs(): Promise<CoreContent<Blog>[] | null> {
    if (!this.db || !isIndexedDBSupported()) {
      return null
    }

    try {
      const transaction = this.db.transaction([STORES.BLOGS], 'readonly')
      const store = transaction.objectStore(STORES.BLOGS)
      const request = store.getAll()

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const blogs = request.result as CoreContent<Blog>[]
          resolve(blogs.length > 0 ? blogs : null)
        }
        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[IndexedDB] Failed to get blogs:', error)
      return null
    }
  },

  /**
   * 保存文章内容
   */
  async savePost(slug: string, content: any) {
    if (!this.db || !isIndexedDBSupported()) {
      return
    }

    try {
      const transaction = this.db.transaction([STORES.POSTS], 'readwrite')
      const store = transaction.objectStore(STORES.POSTS)
      await store.put({
        slug,
        content,
        cachedAt: Date.now(),
      })
    } catch (error) {
      console.error('[IndexedDB] Failed to save post:', error)
    }
  },

  /**
   * 获取文章内容
   */
  async getPost(slug: string): Promise<any | null> {
    if (!this.db || !isIndexedDBSupported()) {
      return null
    }

    try {
      const transaction = this.db.transaction([STORES.POSTS], 'readonly')
      const store = transaction.objectStore(STORES.POSTS)
      const request = store.get(slug)

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.content : null)
        }
        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[IndexedDB] Failed to get post:', error)
      return null
    }
  },

  /**
   * 清空缓存
   */
  async clearCache() {
    if (!this.db || !isIndexedDBSupported()) {
      return
    }

    try {
      const blogsTransaction = this.db.transaction([STORES.BLOGS], 'readwrite')
      await blogsTransaction.objectStore(STORES.BLOGS).clear()

      const postsTransaction = this.db.transaction([STORES.POSTS], 'readwrite')
      await postsTransaction.objectStore(STORES.POSTS).clear()

      const metadataTransaction = this.db.transaction([STORES.METADATA], 'readwrite')
      await metadataTransaction.objectStore(STORES.METADATA).clear()

      console.log('[IndexedDB] Cache cleared')
    } catch (error) {
      console.error('[IndexedDB] Failed to clear cache:', error)
    }
  },
}

// 初始化数据库（在客户端）
if (typeof window !== 'undefined') {
  blogDB.init().catch((error) => {
    console.error('[IndexedDB] Initialization failed:', error)
  })
}

export default blogDB

