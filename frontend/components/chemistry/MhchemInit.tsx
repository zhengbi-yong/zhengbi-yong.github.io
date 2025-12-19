'use client'

import { useEffect } from 'react'

/**
 * MhchemInit - 初始化KaTeX的mhchem扩展
 * 这个组件需要在客户端运行，用于启用化学公式支持
 * 通过CDN加载mhchem扩展
 */
export default function MhchemInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 检查是否已经加载了mhchem
    if ((window as any).mhchem) {
      return
    }

    // 从CDN加载mhchem扩展
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/contrib/mhchem.min.js'
    script.async = true
    script.onload = () => {
      // mhchem加载完成后，它会自动注册到KaTeX
      // 如果KaTeX还未加载，mhchem会在KaTeX加载时自动注册
    }
    script.onerror = () => {
      console.warn('无法加载mhchem扩展，化学公式可能无法正常显示')
    }
    document.head.appendChild(script)

    return () => {
      // 清理脚本（如果需要）
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
