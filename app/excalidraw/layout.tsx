import { Metadata } from 'next'
import ExcalidrawLayoutClient from './ExcalidrawLayoutClient'

export const metadata: Metadata = {
  title: 'Excalidraw 白板 - 在线绘图工具',
  description: '使用 Excalidraw 创建和编辑图表、流程图和白板',
}

export default function ExcalidrawLayout({ children }: { children: React.ReactNode }) {
  return <ExcalidrawLayoutClient>{children}</ExcalidrawLayoutClient>
}
