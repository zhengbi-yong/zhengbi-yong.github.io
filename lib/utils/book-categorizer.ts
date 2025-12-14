import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

/**
 * 章节数据结构
 */
export interface Chapter {
  name: string // 章节名称，如 "emacs"
  path: string // 完整路径，如 "computer/emacs"
  articles: CoreContent<Blog>[]
}

/**
 * 书籍分类数据结构
 */
export interface BookCategory {
  name: string // 分类名，如 "computer"
  chapters: Chapter[]
  totalArticles: number // 该分类下的总文章数
}

/**
 * 书架数据结构
 */
export interface BookShelfData {
  books: BookCategory[]
  uncategorized: CoreContent<Blog>[] // 没有分类的文章（直接在blog根目录下的）
}

/**
 * 分类颜色方案
 */
export interface CategoryColorScheme {
  gradient: string // Tailwind 渐变类名
  gradientDark: string // 深色模式渐变类名
  iconColor: string // 图标颜色类名
  pattern: string // 背景图案类名
}

/**
 * 根据分类名称生成颜色方案
 * 使用 HSL 色相循环生成和谐的配色
 */
export function getCategoryColorScheme(name: string): CategoryColorScheme {
  const normalizedName = name.toLowerCase()

  // 为每个分类分配固定的色相值（HSL）
  const hueMap: Record<string, number> = {
    computer: 220, // 蓝色
    robotics: 280, // 紫色
    math: 260, // 深紫色
    music: 320, // 粉紫色
    photography: 200, // 青色
    motor: 30, // 橙色
    social: 340, // 红色
  }

  const hue = hueMap[normalizedName] || (normalizedName.charCodeAt(0) * 137.508) % 360

  // 生成渐变颜色（使用 Tailwind 颜色系统）
  // 根据色相映射到 Tailwind 颜色
  const colorMap: Record<number, { light: string; dark: string }> = {
    220: {
      light: 'from-blue-500 via-indigo-500 to-purple-500',
      dark: 'from-blue-600 via-indigo-600 to-purple-600',
    },
    280: {
      light: 'from-purple-500 via-pink-500 to-rose-500',
      dark: 'from-purple-600 via-pink-600 to-rose-600',
    },
    260: {
      light: 'from-indigo-500 via-purple-500 to-pink-500',
      dark: 'from-indigo-600 via-purple-600 to-pink-600',
    },
    320: {
      light: 'from-pink-500 via-rose-500 to-red-500',
      dark: 'from-pink-600 via-rose-600 to-red-600',
    },
    200: {
      light: 'from-cyan-500 via-blue-500 to-indigo-500',
      dark: 'from-cyan-600 via-blue-600 to-indigo-600',
    },
    30: {
      light: 'from-orange-500 via-amber-500 to-yellow-500',
      dark: 'from-orange-600 via-amber-600 to-yellow-600',
    },
    340: {
      light: 'from-rose-500 via-pink-500 to-purple-500',
      dark: 'from-rose-600 via-pink-600 to-purple-600',
    },
  }

  const colors = colorMap[hue] || {
    light: 'from-blue-500 via-purple-500 to-pink-500',
    dark: 'from-blue-600 via-purple-600 to-pink-600',
  }

  return {
    gradient: `bg-gradient-to-br ${colors.light}`,
    gradientDark: `bg-gradient-to-br ${colors.dark}`,
    iconColor: 'text-white',
    pattern: 'bg-paper-pattern', // 可以添加自定义背景图案
  }
}

/**
 * 根据分类名称获取卡片装饰颜色
 * 返回用于左侧彩色条的 Tailwind 颜色类名
 */
export function getCategoryColorForCard(name: string): string {
  const normalizedName = name.toLowerCase()

  // 为每个分类分配固定的颜色
  const colorMap: Record<string, string> = {
    computer: 'bg-blue-500',
    robotics: 'bg-purple-500',
    math: 'bg-indigo-500',
    music: 'bg-pink-500',
    photography: 'bg-cyan-500',
    motor: 'bg-orange-500',
    social: 'bg-rose-500',
  }

  return colorMap[normalizedName] || 'bg-primary-500'
}

/**
 * 从文章路径中提取分类信息
 * @param path 文章路径，如 "blog/computer/emacs/config" 或 "blog/computer/alacritty"
 * @returns 分类信息对象
 */
function extractCategoryInfo(path: string): {
  book: string | null
  chapter: string | null
  article: string
} {
  // 移除 "blog/" 前缀
  const cleanPath = path.replace(/^blog\//, '')

  // 分割路径
  const parts = cleanPath.split('/')

  if (parts.length === 1) {
    // 只有文章名，没有分类
    return {
      book: null,
      chapter: null,
      article: parts[0],
    }
  } else if (parts.length === 2) {
    // 有分类，没有子分类
    return {
      book: parts[0],
      chapter: null,
      article: parts[1],
    }
  } else {
    // 有分类和子分类
    return {
      book: parts[0],
      chapter: parts.slice(1, -1).join('/'), // 支持多级子分类
      article: parts[parts.length - 1],
    }
  }
}

/**
 * 将文章列表按书籍结构分类
 * @param posts 文章列表
 * @returns 分类后的书架数据
 */
export function categorizePostsByBookStructure(posts: CoreContent<Blog>[]): BookShelfData {
  const booksMap = new Map<string, Map<string, CoreContent<Blog>[]>>()
  const uncategorized: CoreContent<Blog>[] = []

  // 遍历所有文章，进行分类
  posts.forEach((post) => {
    const path = post.path || post.slug || ''
    const categoryInfo = extractCategoryInfo(path)

    if (!categoryInfo.book) {
      // 没有分类的文章
      uncategorized.push(post)
      return
    }

    const bookName = categoryInfo.book

    // 获取或创建书籍
    if (!booksMap.has(bookName)) {
      booksMap.set(bookName, new Map())
    }

    const chaptersMap = booksMap.get(bookName)!

    // 处理章节
    const chapterName = categoryInfo.chapter || 'default' // 没有子分类的归为"default"章节

    if (!chaptersMap.has(chapterName)) {
      chaptersMap.set(chapterName, [])
    }

    chaptersMap.get(chapterName)!.push(post)
  })

  // 转换为 BookCategory 数组
  const books: BookCategory[] = Array.from(booksMap.entries()).map(([bookName, chaptersMap]) => {
    const chapters: Chapter[] = Array.from(chaptersMap.entries()).map(([chapterName, articles]) => {
      // 按日期排序文章
      const sortedArticles = [...articles].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      return {
        name: chapterName === 'default' ? '' : chapterName, // 空字符串表示没有章节名
        path: chapterName === 'default' ? bookName : `${bookName}/${chapterName}`,
        articles: sortedArticles,
      }
    })

    // 按章节名称排序（default章节放在最后）
    chapters.sort((a, b) => {
      if (a.name === '') return 1
      if (b.name === '') return -1
      return a.name.localeCompare(b.name)
    })

    // 计算总文章数
    const totalArticles = chapters.reduce((sum, chapter) => sum + chapter.articles.length, 0)

    return {
      name: bookName,
      chapters,
      totalArticles,
    }
  })

  // 按书籍名称排序
  books.sort((a, b) => a.name.localeCompare(b.name))

  return {
    books,
    uncategorized,
  }
}

/**
 * 根据分类名称获取单个分类数据
 * @param categoryName 分类名称
 * @param posts 文章列表
 * @returns 分类数据，如果不存在则返回 null
 */
export function getBookByCategory(
  categoryName: string,
  posts: CoreContent<Blog>[]
): BookCategory | null {
  const bookShelfData = categorizePostsByBookStructure(posts)
  const normalizedCategoryName = categoryName.toLowerCase()

  const book = bookShelfData.books.find((b) => b.name.toLowerCase() === normalizedCategoryName)

  return book || null
}
