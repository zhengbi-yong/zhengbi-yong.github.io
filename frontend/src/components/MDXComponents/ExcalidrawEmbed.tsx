'use client'

import React, { useState } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { ExcalidrawModal } from '@/components/ui/ExcalidrawModal'
import { cn } from '@/components/lib/utils'

interface ExcalidrawEmbedProps {
  id?: string
  width?: string
  height?: string
  readonly?: boolean
  title?: string
}

export function ExcalidrawEmbed({
  id: _id,
  width = '100%',
  height = '400px',
  readonly: _readonly = true,
  title = 'Excalidraw 绘图',
}: ExcalidrawEmbedProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpenModal()
    }
  }

  void _id
  void _readonly

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
          'cursor-pointer bg-gray-50 dark:bg-gray-800'
        )}
        style={{ width, height }}
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={handleKeyDown}
        aria-label="打开 Excalidraw 绘图"
      >
        <div className="p-4 text-center">
          <div className="mb-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <p className="mb-2 text-gray-500 dark:text-gray-400">点击打开 Excalidraw 绘图</p>
          <Button onClick={handleOpenModal} size="sm">
            创建绘图
          </Button>
        </div>
      </div>
      <ExcalidrawModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title} />
    </>
  )
}
