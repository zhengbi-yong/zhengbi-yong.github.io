'use client'

import { useEffect } from 'react'

/**
 * I18nProvider - 客户端 i18next 初始化组件
 * 在客户端组件中初始化 i18next，解决 useTranslation 警告
 * 使用动态导入确保只在客户端执行，避免服务端 createContext 错误
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 动态导入 i18n-client，确保只在客户端执行
    // i18n-client.ts 会自动初始化 i18next 实例
    import('@/lib/i18n-client')
  }, [])

  return <>{children}</>
}
