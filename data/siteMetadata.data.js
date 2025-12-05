const basePath = process.env.BASE_PATH || ''

const siteMetadata = {
  title: 'Zhengbi Yong',
  author: '雍征彼',
  headerTitle: 'Zhengbi Yong',
  description: '远离颠倒梦想，究竟涅槃。',
  language: 'zh-CN',
  theme: 'system',
  siteUrl: 'https://zhengbi-yong.top',
  siteRepo: 'https://github.com/zhengbi-yong/zhengbi-yong.github.io',
  siteLogo: `${basePath}/static/images/logo.svg`,
  socialBanner: `${basePath}/static/images/twitter-card.png`,
  mastodon: 'https://mastodon.social/@zhengbi_yong',
  email: 'zhengbi.yong@outlook.com',
  github: 'https://github.com/zhengbi-yong',
  x: 'https://x.com/SisyphusYong',
  facebook: 'https://www.facebook.com/zhengbi.yong.china',
  youtube: 'https://www.youtube.com/@PetersSmile',
  linkedin: 'https://www.linkedin.com',
  threads: 'https://www.threads.com/@zhengbi.yong.china',
  instagram: 'https://www.instagram.com/zhengbi.yong.china/',
  xiaohongshu: 'https://www.xiaohongshu.com/user/profile/5e69104300000000010011d5',
  locale: 'zh-CN',
  stickyNav: false,
  defaultShowTOC: true,
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.NEXT_UMAMI_ID ?? '',
    },
  },
  newsletter: {
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? '',
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID ?? '',
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? '',
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? '',
      mapping: 'pathname',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${basePath}/search.json`,
    },
  },
}

export default siteMetadata


