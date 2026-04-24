'use client'

/**
 * Post Versions Page - 文章版本管理页面
 *
 * 功能：
 * - 查看版本历史
 * - 版本对比
 * - 恢复到指定版本
 */

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { adminService, postService } from '@/lib/api/backend'
import type { PostDetail, PostVersion } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'

type ComparisonView = {
  version1: PostVersion | null
  version2: PostVersion | null
  showDiff: boolean
}

export default function PostVersionsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { t } = useTranslation()
  const router = useRouter()
  // join() reconstructs the full slug from catch-all segments, then decode
  const resolvedParams = use(params)
  const slug = decodeURIComponent(resolvedParams.slug.join('/'))

  const [post, setPost] = useState<PostDetail | null>(null)
  const [versions, setVersions] = useState<PostVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [comparison, setComparison] = useState<ComparisonView>({
    version1: null,
    version2: null,
    showDiff: false,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Fetch post first to get the internal database ID
        const postData = await postService.getPost(slug)
        setPost(postData)
        const response = await adminService.getPostVersions(postData.id)
        setVersions(response.versions || [])
      } catch (e) {
        console.error('Failed to load versions:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const handleRestore = async (versionNumber: string, title: string) => {
    if (!post) return
    if (!confirm(`确定要恢复到版本 ${versionNumber}（${title}）吗？\n\n当前版本将被覆盖。`)) {
      return
    }

    setRestoring(versionNumber)
    try {
      await adminService.restorePostVersion(post.id, versionNumber)
      alert('恢复成功！页面将刷新。')
      router.refresh()
    } catch (_e) {
      alert('恢复失败')
    } finally {
      setRestoring(null)
    }
  }

  const handleCompare = async () => {
    if (!post || !comparison.version1 || !comparison.version2) {
      alert('请选择两个版本进行对比')
      return
    }

    if (comparison.version1.version_number === comparison.version2.version_number) {
      alert('请选择两个不同的版本')
      return
    }

    try {
      await adminService.comparePostVersions(
        post.id,
        comparison.version1.version_number.toString(),
        comparison.version2.version_number.toString()
      )
      setComparison((prev) => ({ ...prev, showDiff: true }))
    } catch (_e) {
      alert('获取对比结果失败')
    }
  }

  const selectedCount = [comparison.version1, comparison.version2].filter(Boolean).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← {t('back') || '返回'}
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('blog.versions') || '版本历史'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {post ? `《${post.title}》` : '加载中...'} · 共 {versions.length} 个版本
        </p>
      </div>

      {/* 操作栏 */}
      {selectedCount > 0 && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                已选择 {selectedCount} 个版本
              </p>
              {comparison.version1 && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  版本 {comparison.version1.version_number}: {comparison.version1.title}
                </p>
              )}
              {comparison.version2 && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  版本 {comparison.version2.version_number}: {comparison.version2.title}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCompare}
                disabled={selectedCount !== 2}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('blog.compare') || '对比版本'}
              </button>
              <button
                onClick={() => setComparison({ version1: null, version2: null, showDiff: false })}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('cancel') || '取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            暂无版本历史
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            文章首次创建后，每次修改都会自动创建新版本
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">选择</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">版本号</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">创建者</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">备注</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {versions.map((version) => (
                <tr key={version.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={
                        comparison.version1?.id === version.id || comparison.version2?.id === version.id
                      }
                      onChange={(e) => {
                        const checked = e.target.checked
                        setComparison((prev) => {
                          if (!prev.version1 && checked) return { ...prev, version1: version }
                          else if (!prev.version2 && checked && prev.version1?.id !== version.id)
                            return { ...prev, version2: version }
                          else if (prev.version1?.id === version.id && !checked)
                            return { ...prev, version1: null }
                          else if (prev.version2?.id === version.id && !checked)
                            return { ...prev, version2: null }
                          else if (checked && prev.version1?.id !== version.id && prev.version2?.id !== version.id)
                            return { ...prev, version2: version }
                          return prev
                        })
                      }}
                      className="rounded border-gray-300"
                      disabled={
                        comparison.version1 !== null &&
                        comparison.version2 !== null &&
                        comparison.version1?.id !== version.id &&
                        comparison.version2?.id !== version.id
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    #{version.version_number}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {version.title}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(version.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {version.created_by_username || version.created_by}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {version.comment || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => handleRestore(version.version_number.toString(), version.title)}
                      disabled={restoring === version.version_number.toString()}
                      className="rounded bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                    >
                      {restoring === version.version_number.toString()
                        ? t('loading') || '恢复中...'
                        : t('blog.restore') || '恢复此版本'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 版本对比视图 */}
      {comparison.showDiff && comparison.version1 && comparison.version2 && (
        <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('blog.versionComparison') || '版本对比'}
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                版本 {comparison.version1.version_number}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{comparison.version1.title}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-2 text-sm font-medium text-green-900 dark:text-green-200">
                版本 {comparison.version2.version_number}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{comparison.version2.title}</p>
            </div>
          </div>
          <div className="space-y-4">
            {comparison.version1.title !== comparison.version2.title && (
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">标题变更</h4>
                <div className="rounded border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="mb-1 text-xs text-red-600 dark:text-red-400">旧版本</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-through">
                    {comparison.version1.title}
                  </p>
                </div>
                <div className="mt-2 rounded border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <p className="mb-1 text-xs text-green-600 dark:text-green-400">新版本</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comparison.version2.title}</p>
                </div>
              </div>
            )}
            {comparison.version1.content !== comparison.version2.content && (
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">内容变更</h4>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                    内容长度: {comparison.version1.content.length} → {comparison.version2.content.length} 字符 (
                    {comparison.version2.content.length > comparison.version1.content.length ? '+' : ''}
                    {comparison.version2.content.length - comparison.version1.content.length})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
