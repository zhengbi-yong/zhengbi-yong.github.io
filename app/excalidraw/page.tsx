import { Metadata } from 'next'
import { ExcalidrawViewer } from '@/components/Excalidraw/ExcalidrawViewer'

export const metadata: Metadata = {
  title: 'Excalidraw 白板 - 在线绘图工具',
  description: '使用 Excalidraw 创建和编辑图表、流程图和白板',
}

export default function ExcalidrawPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <ExcalidrawViewer height="100vh" showToolbar={true} />
    </div>
  )
}
