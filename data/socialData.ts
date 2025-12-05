import siteMetadata from './siteMetadata'

export interface SocialItem {
  id: number
  name: string
  username: string
  url: string
  image: string
  isShow: boolean
}

/**
 * 社交媒体数据配置
 * 参考 Astro 项目的 social.json
 * 基于 siteMetadata 生成社交媒体链接和图片
 */
const socialData: SocialItem[] = [
  {
    id: 1,
    name: 'GitHub',
    username: siteMetadata.github?.split('/').pop() || 'github',
    url: siteMetadata.github || '#',
    image: '/assets/social/social-github.jpg',
    isShow: !!siteMetadata.github,
  },
  {
    id: 2,
    name: 'X (Twitter)',
    username: siteMetadata.x?.split('/').pop()?.replace('@', '') || 'x',
    url: siteMetadata.x || '#',
    image: '/assets/social/social-twitter.jpg',
    isShow: !!siteMetadata.x,
  },
  {
    id: 3,
    name: 'LinkedIn',
    username: siteMetadata.linkedin?.split('/').pop() || 'linkedin',
    url: siteMetadata.linkedin || '#',
    image: '/assets/social/social-dribbble.jpg', // 使用现有的图片，如果没有 linkedin 图片
    isShow: !!siteMetadata.linkedin,
  },
  {
    id: 4,
    name: 'Email',
    username: siteMetadata.email?.split('@')[0] || 'email',
    url: `mailto:${siteMetadata.email}`,
    image: '/assets/social/social-email.jpg',
    isShow: !!siteMetadata.email,
  },
  {
    id: 5,
    name: 'YouTube',
    username: siteMetadata.youtube?.split('/').pop() || 'youtube',
    url: siteMetadata.youtube || '#',
    image: '/assets/social/social-gumroad.jpg', // 使用现有的图片，如果没有 youtube 图片
    isShow: !!siteMetadata.youtube,
  },
  {
    id: 6,
    name: 'Instagram',
    username: siteMetadata.instagram?.split('/').pop() || 'instagram',
    url: siteMetadata.instagram || '#',
    image: '/assets/social/social-figma.jpg', // 使用现有的图片，如果没有 instagram 图片
    isShow: !!siteMetadata.instagram,
  },
  {
    id: 7,  // 使用新的 id
    name: '小红书',
    username: siteMetadata.xiaohongshu?.split('/').pop() || 'xiaohongshu',
    url: siteMetadata.xiaohongshu || '#',
    image: '/assets/social/social-xiaohongshu.jpg',
    isShow: !!siteMetadata.xiaohongshu,
  },
]

export default socialData
