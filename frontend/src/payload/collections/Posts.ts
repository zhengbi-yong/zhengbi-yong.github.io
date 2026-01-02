import { CollectionConfig } from 'payload'
import { slug } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    preview: (doc) => `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001'}/blog/${doc.slug}`,
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL 路径的一部分',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value
            return slug(data.title || '')
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: '文章摘要，用于 SEO 和列表显示',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: '文章正文内容',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: '简短摘要',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          displayFormat: 'YYYY-MM-DD HH:mm',
        },
      },
    },
    {
      name: 'lastmod',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'YYYY-MM-DD HH:mm',
        },
      },
    },
    {
      name: 'draft',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: '草稿文章不会在前端显示',
      },
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
        },
      ],
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: '文章标签',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: '文章分类',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: '主分类（已弃用，建议使用 categories）',
      },
    },
    {
      name: 'layout',
      type: 'text',
      defaultValue: 'PostLayout',
      admin: {
        description: '页面布局组件',
      },
    },
    {
      name: 'showTOC',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: '是否显示目录',
      },
    },
    {
      name: 'math',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: '文章是否包含数学公式',
      },
    },
    {
      name: 'canonicalUrl',
      type: 'text',
      admin: {
        description: '规范 URL（用于 SEO）',
      },
    },
    {
      name: 'bibliography',
      type: 'textarea',
      admin: {
        description: '参考文献',
      },
    },
    {
      name: 'readingTime',
      type: 'json',
      admin: {
        description: '阅读时间（自动计算）',
      },
    },
  ],
  timestamps: true,
}
