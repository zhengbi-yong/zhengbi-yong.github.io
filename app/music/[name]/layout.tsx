import { ReactNode } from 'react'

export default function MusicLayout({ children }: { children: ReactNode }) {
  // 返回不包含 Header 和 Footer 的布局，让全屏组件完全控制页面
  return <>{children}</>
}

