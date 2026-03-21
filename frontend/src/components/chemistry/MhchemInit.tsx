'use client'

import { useEffect } from 'react'

/**
 * MhchemInit - 初始化KaTeX的mhchem扩展
 * 这个组件需要在客户端运行，用于启用化学公式支持
 * 直接使用npm包，避免动态脚本加载的CSP问题
 */
export default function MhchemInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    // 检查是否已经加载了mhchem
    if ((window as any).katex?.__defineMacro) {
      return undefined
    }

    // 首先确保KaTeX已加载，然后再加载mhchem
    const loadMhchem = async () => {
      try {
        // 动态导入KaTeX和mhchem
        const katex = await import('katex')

        // 确保全局可访问
        if (typeof window !== 'undefined') {
          ;(window as any).katex = katex
        }

        // 导入mhchem扩展
        await import('katex/contrib/mhchem')

        console.log('mhchem扩展加载成功')
      } catch (error) {
        console.warn('无法加载mhchem扩展，化学公式可能无法正常显示', error)
      }
    }

    // 开始加载mhchem
    loadMhchem()

    return () => {
      // 不清理，因为其他组件可能仍在使用
    }
  }, [])

  return null
}
