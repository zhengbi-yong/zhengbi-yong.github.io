import { writeFileSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// 读取 contentlayer 生成的数据
function loadBlogData() {
  try {
    const blogDir = join(process.cwd(), '.contentlayer', 'generated', 'Blog')
    const files = readdirSync(blogDir).filter((f) => f.endsWith('.json'))

    const blogs = []
    for (const file of files) {
      const filePath = join(blogDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      blogs.push(data)
    }

    return blogs
  } catch (error) {
    console.error('无法加载博客数据:', error)
    return []
  }
}

// 搜索文档结构
function generateSearchDocuments() {
  const documents = []
  const allBlogs = loadBlogData()

  // 添加所有博客文章
  allBlogs.forEach((post) => {
    documents.push({
      id: post.slug,
      title: post.title,
      url: post.url,
      content: post.summary || '', // 使用摘要作为内容
      tags: post.tags || [],
      category: post.category || '',
      date: post.date,
      type: 'post',
    })
  })

  // 添加页面
  const pages = [
    {
      id: 'about',
      title: '关于我',
      url: '/about',
      content: '了解更多关于我的信息',
      type: 'page',
    },
    {
      id: 'projects',
      title: '项目展示',
      url: '/projects',
      content: '查看我的项目作品集',
      type: 'page',
    },
    {
      id: 'music',
      title: '音乐作品',
      url: '/music',
      content: '我的音乐创作和表演',
      type: 'page',
    },
    {
      id: 'blog',
      title: '博客',
      url: '/blog',
      content: '技术文章和生活感悟',
      type: 'page',
    },
  ]

  documents.push(...pages)

  return documents
}

async function generateSearchIndex() {
  try {
    console.log('🔍 生成搜索索引...')

    const documents = generateSearchDocuments()

    // 写入搜索索引文件
    const outputPath = join(process.cwd(), 'public', 'search.json')
    writeFileSync(outputPath, JSON.stringify(documents, null, 2))

    console.log(`✓ 搜索索引已生成: ${outputPath}`)
    console.log(`✓ 共索引 ${documents.length} 个文档`)

    // 按类型统计
    const stats = {
      posts: documents.filter((d) => d.type === 'post').length,
      pages: documents.filter((d) => d.type === 'page').length,
    }
    console.log(`✓ 包含 ${stats.posts} 篇文章和 ${stats.pages} 个页面`)
  } catch (error) {
    console.error('❌ 生成搜索索引失败:', error)
    process.exit(1)
  }
}

// 运行脚本
generateSearchIndex()
