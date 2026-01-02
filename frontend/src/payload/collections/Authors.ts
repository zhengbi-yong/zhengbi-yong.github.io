import { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'text',
      admin: {
        description: '头像图片 URL',
      },
    },
    {
      name: 'occupation',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'twitter',
      type: 'text',
      admin: {
        description: 'Twitter 用户名',
      },
    },
    {
      name: 'bluesky',
      type: 'text',
      admin: {
        description: 'Bluesky 用户名',
      },
    },
    {
      name: 'linkedin',
      type: 'text',
      admin: {
        description: 'LinkedIn URL',
      },
    },
    {
      name: 'github',
      type: 'text',
      admin: {
        description: 'GitHub 用户名',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description: '作者简介',
      },
    },
    {
      name: 'layout',
      type: 'text',
      admin: {
        description: '作者页面布局',
      },
    },
  ],
}
