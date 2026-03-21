'use client'

/**
 * Reading List Page - 阅读列表页面
 *
 * 功能：
 * - 显示所有收藏的文章
 * - 添加笔记
 * - 删除收藏
 * - 搜索和过滤
 * - 分页
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { bookmarkService } from '@/lib/api/backend'
import type { Bookmark } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import BookmarkButton from '@/components/BookmarkButton'

export default function ReadingListPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const loadBookmarks = async (page: number) => {
    if (!user) return

    setLoading(true)
    try {
      const response = await bookmarkService.getBookmarks(page, 20)
      setBookmarks(response.bookmarks)
      setTotalPages(response.total_pages)
      setTotalCount(response.total)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        loadBookmarks(currentPage)
      } else {
        setLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, currentPage])

  // 保存笔记
  const handleSaveNote = async (bookmarkId: string, postId: string) => {
    try {
      await bookmarkService.updateBookmarkNote(postId, noteText)
      // 重新加载当前页
      loadBookmarks(currentPage)
      setEditingNote(null)
      setNoteText('')
    } catch (error) {
      alert(t('bookmark.saveNoteFailed') || '保存笔记失败')
    }
  }

  // 删除收藏
  const handleRemoveBookmark = async (postId: string) => {
    if (!confirm(t('bookmark.confirmRemove') || '确定要取消收藏吗？')) {
      return
    }

    try {
      await bookmarkService.removeBookmark(postId)
      // 重新加载当前页
      loadBookmarks(currentPage)
    } catch (error) {
      alert(t('bookmark.removeFailed') || '取消收藏失败')
    }
  }

  // 过滤后的书签
  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.post_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bookmark.note && bookmark.note.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // 未登录显示
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">📚</div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('bookmark.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('bookmark.loginToViewList') || '登录后即可查看您的阅读列表'}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            {t('auth.login') || '登录'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('bookmark.readingList') || '阅读列表'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('bookmark.readingListDesc') || '您收藏的文章，随时可以继续阅读'} ({totalCount})
        </p>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('bookmark.searchPlaceholder') || '搜索收藏的文章...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">📚</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {searchQuery
              ? (t('bookmark.noSearchResults') || '没有找到匹配的文章')
              : (t('bookmark.noBookmarks') || '暂无收藏')}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {searchQuery
              ? (t('bookmark.tryDifferentSearch') || '试试其他关键词')
              : (t('bookmark.startSaving') || '开始收藏您喜欢的文章')}
          </p>
          {!searchQuery && (
            <Link
              href="/blog"
              className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
            >
              {t('nav.blog') || '浏览文章'}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/blog/${bookmark.post_slug}`}
                      className="mb-2 text-xl font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {bookmark.post_title}
                    </Link>

                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {t('bookmark.savedOn') || '收藏于'}:{' '}
                        {new Date(bookmark.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      {bookmark.updated_at !== bookmark.created_at && (
                        <span>
                          {t('bookmark.updatedOn') || '更新于'}:{' '}
                          {new Date(bookmark.updated_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>

                    {/* 笔记部分 */}
                    {editingNote === bookmark.id ? (
                      <div className="mb-4">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t('bookmark.addNote') || '添加笔记...'}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          rows={3}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleSaveNote(bookmark.id, bookmark.post_id)}
                            className="rounded bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
                          >
                            {t('bookmark.save') || '保存'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingNote(null)
                              setNoteText('')
                            }}
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {t('cancel') || '取消'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        {bookmark.note ? (
                          <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                            <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              {t('bookmark.note') || '笔记'}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{bookmark.note}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/blog/${bookmark.post_slug}`}
                      className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      {t('bookmark.read') || '阅读'}
                    </Link>
                    <button
                      onClick={() => {
                        setEditingNote(bookmark.id)
                        setNoteText(bookmark.note || '')
                      }}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {bookmark.note ? (t('bookmark.editNote') || '编辑笔记') : (t('bookmark.addNote') || '添加笔记')}
                    </button>
                    <BookmarkButton
                      postId={bookmark.post_id}
                      postSlug={bookmark.post_slug}
                      postTitle={bookmark.post_title}
                      variant="icon"
                      className="border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('previous') || '上一页'}
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('page') || '第'} {currentPage} / {totalPages} {t('page') || '页'}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('next') || '下一页'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
