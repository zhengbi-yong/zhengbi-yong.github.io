'use client'

/**
 * Admin Media Page - 媒体管理页面
 *
 * 功能：
 * - 查看所有媒体文件
 * - 筛选未使用的媒体
 * - 预览图片
 * - 删除媒体
 * - 优化存储空间
 */

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/api/backend'
import type { MediaItem, MediaDetail } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'

export default function AdminMediaPage() {
  const { t } = useTranslation()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [showUnused, setShowUnused] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [previewMedia, setPreviewMedia] = useState<MediaDetail | null>(null)

  const loadMedia = async () => {
    setLoading(true)
    try {
      if (showUnused) {
        const response = await adminService.getUnusedMedia()
        setMedia(response || [])
        setTotal(response?.length || 0)
      } else {
        const response = await adminService.getMedia({ page, limit: pageSize })
        setMedia(response.media || [])
        setTotal(response.total || 0)
      }
    } catch (e) {
      console.error('Failed to load media:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [page, showUnused])

  const handleDelete = async (mediaId: string, filename: string) => {
    if (!confirm(`确定要删除媒体文件 "${filename}" 吗？此操作不可撤销。`)) {
      return
    }

    setDeleting((prev) => new Set(prev).add(mediaId))
    try {
      await adminService.deleteMedia(mediaId)
      // 重新加载列表
      loadMedia()
    } catch (_e) {
      alert('删除失败')
      setDeleting((prev) => {
        const newSet = new Set(prev)
        newSet.delete(mediaId)
        return newSet
      })
    }
  }

  const handlePreview = async (mediaId: string) => {
    try {
      const detail = await adminService.getMediaById(mediaId)
      setPreviewMedia(detail)
    } catch (e) {
      console.error('Failed to load media detail:', e)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedMedia.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedMedia.size} 个媒体文件吗？此操作不可撤销。`)) {
      return
    }

    try {
      for (const mediaId of selectedMedia) {
        await adminService.deleteMedia(mediaId)
      }
      setSelectedMedia(new Set())
      loadMedia()
    } catch (_e) {
      alert('批量删除失败')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const totalSize = media.reduce((sum, item) => sum + item.size_bytes, 0)
  const unusedCount = media.filter((item) => item.usage_count === 0).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('admin.media') || '媒体管理'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          共 {total} 个文件，总大小 {formatFileSize(totalSize)}
          {unusedCount > 0 && `，其中 ${unusedCount} 个未使用`}
        </p>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showUnused}
              onChange={(e) => {
                setShowUnused(e.target.checked)
                setPage(1)
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              仅显示未使用的媒体
            </span>
          </label>

          {selectedMedia.size > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                已选择 {selectedMedia.size} 个文件
              </span>
              <button
                onClick={handleBatchDelete}
                className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                批量删除
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : media.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">🖼️</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {showUnused ? '没有未使用的媒体文件' : '没有媒体文件'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {showUnused ? '太好了！所有媒体文件都在使用中' : '上传第一个媒体文件开始使用'}
          </p>
        </div>
      ) : (
        <>
          {/* 媒体网格 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.map((item) => (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-lg border-2 bg-white shadow transition-all hover:shadow-lg dark:bg-gray-800 ${
                  selectedMedia.has(item.id)
                    ? 'border-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
                } ${item.usage_count === 0 ? 'opacity-60' : ''}`}
              >
                {/* 选择复选框 */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedMedia.has(item.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedMedia)
                      if (e.target.checked) {
                        newSelected.add(item.id)
                      } else {
                        newSelected.delete(item.id)
                      }
                      setSelectedMedia(newSelected)
                    }}
                    className="rounded border-gray-300"
                  />
                </div>

                {/* 未使用标记 */}
                {item.usage_count === 0 && (
                  <div className="absolute top-2 right-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-medium text-yellow-900">
                    未使用
                  </div>
                )}

                {/* 媒体预览 */}
                <div
                  className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
                  onClick={() => handlePreview(item.id)}
                >
                  {item.mime_type.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl">📄</span>
                    </div>
                  )}
                </div>

                {/* 文件信息 */}
                <div className="p-3">
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                    {item.filename}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {formatFileSize(item.size_bytes)}
                  </p>
                  {item.usage_count !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      使用 {item.usage_count} 次
                    </p>
                  )}

                  {/* 操作按钮 */}
                  <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handlePreview(item.id)}
                      className="flex-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
                    >
                      预览
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.filename)}
                      disabled={deleting.has(item.id)}
                      className="flex-1 rounded border border-red-300 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                    >
                      {deleting.has(item.id) ? '删除中' : '删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {!showUnused && total > pageSize && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('previous') || '上一页'}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('next') || '下一页'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 预览模态框 */}
      {previewMedia && (
        <div
          className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="max-w-4xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {previewMedia.filename}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(previewMedia.size_bytes)} • {previewMedia.mime_type}
                </p>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {previewMedia.mime_type.startsWith('image/') ? (
              <img
                src={previewMedia.cdn_url || previewMedia.storage_path}
                alt={previewMedia.filename}
                className="max-h-[70vh] w-auto rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-4xl">📄</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    此文件类型不支持预览
                  </p>
                  <a
                    href={previewMedia.cdn_url || previewMedia.storage_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                  >
                    下载文件
                  </a>
                </div>
              </div>
            )}

            {previewMedia.alt_text && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">替代文本:</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {previewMedia.alt_text}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => handleDelete(previewMedia.id, previewMedia.filename)}
                className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                删除此文件
              </button>
              <button
                onClick={() => setPreviewMedia(null)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
