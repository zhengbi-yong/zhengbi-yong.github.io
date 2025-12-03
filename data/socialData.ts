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
    image: '/static/images/social/github.png',
    isShow: !!siteMetadata.github,
  },
  {
    id: 2,
    name: 'X (Twitter)',
    username: siteMetadata.x?.split('/').pop()?.replace('@', '') || 'x',
    url: siteMetadata.x || '#',
    image: '/static/images/social/x.png',
    isShow: !!siteMetadata.x,
  },
  {
    id: 3,
    name: 'LinkedIn',
    username: siteMetadata.linkedin?.split('/').pop() || 'linkedin',
    url: siteMetadata.linkedin || '#',
    image: '/static/images/social/linkedin.png',
    isShow: !!siteMetadata.linkedin,
  },
  {
    id: 4,
    name: 'Email',
    username: siteMetadata.email?.split('@')[0] || 'email',
    url: `mailto:${siteMetadata.email}`,
    image: '/static/images/social/email.png',
    isShow: !!siteMetadata.email,
  },
  {
    id: 5,
    name: 'YouTube',
    username: siteMetadata.youtube?.split('/').pop() || 'youtube',
    url: siteMetadata.youtube || '#',
    image: '/static/images/social/youtube.png',
    isShow: !!siteMetadata.youtube,
  },
  {
    id: 6,
    name: 'Instagram',
    username: siteMetadata.instagram?.split('/').pop() || 'instagram',
    url: siteMetadata.instagram || '#',
    image: '/static/images/social/instagram.png',
    isShow: !!siteMetadata.instagram,
  },
]

export default socialData
