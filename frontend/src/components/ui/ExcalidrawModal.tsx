'use client'

import { Button } from '@/components/shadcn/ui/button'
import { ExcalidrawViewer } from '@/components/Excalidraw/ExcalidrawViewer'

interface ExcalidrawModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    elements?: unknown[]
    appState?: unknown
    files?: unknown
  }
  title?: string
}

export function ExcalidrawModal({
  isOpen,
  onClose,
  initialData,
  title = '快速绘图',
}: ExcalidrawModalProps) {
  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="m-4 flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button onClick={onClose} size="sm" variant="ghost">
            关闭
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ExcalidrawViewer initialData={initialData} height="100%" showToolbar={true} />
        </div>
      </div>
    </div>
  )
}
