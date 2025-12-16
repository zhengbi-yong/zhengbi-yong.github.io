import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 初始化状态标志，防止重复初始化（特别是在 HMR 更新时）
let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * 初始化 i18next
 * 只在客户端执行，并防止重复初始化
 * 使用动态导入 JSON 文件以避免 HMR 更新时的模块评估问题
 */
export function initI18n() {
  // 只在客户端执行
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  // 如果已经初始化，跳过（防止 HMR 更新时重复初始化）
  if (isInitialized) {
    return Promise.resolve()
  }

  // 如果 i18n 已经初始化，也跳过
  if (i18n.isInitialized) {
    isInitialized = true
    return Promise.resolve()
  }

  // 如果正在初始化，返回现有的 Promise
  if (initPromise) {
    return initPromise
  }

  // 使用动态导入加载 JSON 资源，避免模块顶层的副作用
  initPromise = Promise.all([
    import('@/locales/en/common.json'),
    import('@/locales/zh-CN/common.json'),
  ])
    .then(([enModule, zhCNModule]) => {
      const enCommon = enModule.default
      const zhCNCommon = zhCNModule.default

      return (
        i18n
          // 检测用户语言
          .use(LanguageDetector)
          // 传递给 react-i18next
          .use(initReactI18next)
          // 初始化 i18next
          .init({
            // 支持的语言
            supportedLngs: ['en', 'zh-CN'],
            // 默认语言
            fallbackLng: 'en',
            // 默认命名空间
            defaultNS: 'common',
            // 资源内联，直接导入翻译文件
            resources: {
              en: {
                common: enCommon,
              },
              'zh-CN': {
                common: zhCNCommon,
              },
            },
            // 语言检测配置
            detection: {
              // 按优先级顺序检测语言
              order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
              // 从 cookie 中检测语言的键名
              lookupCookie: 'i18next',
              // 从 localStorage 中检测语言的键名
              lookupLocalStorage: 'i18nextLng',
              // 缓存检测
              caches: ['localStorage', 'cookie'],
            },
            // 调试模式（开发环境）
            debug: process.env.NODE_ENV === 'development',
            // 预加载所有命名空间
            ns: ['common'],
            // 如果命名空间不存在，使用默认命名空间
            fallbackNS: 'common',
            // 插值配置
            interpolation: {
              escapeValue: false, // React 已经转义了
            },
          })
      )
    })
    .then(() => {
      isInitialized = true
      initPromise = null
    })
    .catch((error) => {
      console.error('i18n initialization error:', error)
      initPromise = null
      throw error
    })

  return initPromise
}

// 导出 i18n 实例
export default i18n
