/** @type {import('next-i18next').NextI18NextConfig} */
const { i18n } = require('next-i18next')

module.exports = i18n({
  debug: process.env.NODE_ENV === 'development',

  // 支持的语言
  supportedLngs: ['en', 'zh-CN'],

  // 默认语言
  fallbackLng: 'en',

  // 默认命名空间
  defaultNS: 'common',

  // 语言文件路径
  localePath: './locales/{{lng}}/{{ns}}.json',

  // 语言检测策略
  detection: {
    // 按优先级顺序检测语言
    order: [
      'cookie',
      'header',
      'navigator',
      'localStorage',
      'path',
      'subdomain',
    ],

    // 从 cookie 中检测语言的键名
    lookupCookie: 'i18next',

    // 从 header 中检测语言的键名
    lookupHeader: 'accept-language',

    // 从 localStorage 中检测语言的键名
    lookupLocalStorage: 'i18nextLng',

    // 路径前缀检测
    lookupFromPathOnly: true,

    // 缓存检测
    caches: ['localStorage', 'cookie'],
  },

  // 预加载所有命名空间的文件
  ns: ['common'],

  // 重命名命名空间
  reloadOnPrerender: process.env.NODE_ENV === 'development',
})