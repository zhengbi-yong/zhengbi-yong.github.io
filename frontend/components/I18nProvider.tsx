// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { initI18n } from '@/lib/i18n-client'

/**
 * I18nProvider - 客户端 i18next 初始化组件
 * 在客户端组件中初始化 i18next，解决 useTranslation 警告
 * 使用 useEffect 确保只在客户端执行，并兼容 HMR 更新
 * 使用动态导入 JSON 资源以避免 HMR 更新时的模块评估问题
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 在客户端组件挂载时初始化 i18next
    // initI18n 函数内部有保护机制，防止重复初始化
    // 使用动态导入避免模块顶层的副作用，解决 HMR 问题
    initI18n().catch((error) => {
      // 错误已经在 initI18n 中记录，这里只做额外处理（如果需要）
      logger.error('Failed to initialize i18n:', error)
    })
  }, [])

  return <>{children}</>
}
