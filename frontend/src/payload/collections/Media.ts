import { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: '图片描述，用于无障碍访问',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      admin: {
        description: '图片说明',
      },
    },
  ],
  upload: {
    staticURL: '/assets/media',
    staticDir: path.resolve(__dirname, '../../public/assets/media'),
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 640,
        height: 480,
      },
      {
        name: 'tablette',
        width: 1024,
        height: null,
      },
      {
        name: 'large',
        width: 1920,
        height: null,
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
}
