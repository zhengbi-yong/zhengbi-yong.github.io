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
          className="mb-4 text-sm text-primary hover:text-primary dark:text-primary"
        >
          ← {t('back') || '返回'}
        </button>
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
          {t('blog.versions') || '版本历史'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          {post ? `《${post.title}》` : '加载中...'} · 共 {versions.length} 个版本
        </p>
      </div>

      {/* 操作栏 */}
      {selectedCount > 0 && (
        <div className="mb-6 rounded-lg bg-[var(--theme-info-muted)] p-4 dark:bg-[var(--theme-info-muted)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-[var(--theme-fg)]">
                已选择 {selectedCount} 个版本
              </p>
              {comparison.version1 && (
                <p className="text-xs text-primary dark:text-blue-300">
                  版本 {comparison.version1.version_number}: {comparison.version1.title}
                </p>
              )}
              {comparison.version2 && (
                <p className="text-xs text-primary dark:text-blue-300">
                  版本 {comparison.version2.version_number}: {comparison.version2.title}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCompare}
                disabled={selectedCount !== 2}
                className="rounded bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('blog.compare') || '对比版本'}
              </button>
              <button
                onClick={() => setComparison({ version1: null, version2: null, showDiff: false })}
                className="rounded border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted dark:border-border dark:text-foreground dark:hover:bg-secondary"
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
        <div className="rounded-lg bg-background p-12 text-center shadow dark:bg-card">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground dark:text-foreground">
            暂无版本历史
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground">
            文章首次创建后，每次修改都会自动创建新版本
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-background shadow dark:bg-card">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-muted dark:bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">选择</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">版本号</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">创建者</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">备注</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {versions.map((version) => (
                <tr key={version.id} className="hover:bg-muted dark:hover:bg-secondary/50">
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
                      className="rounded border-border"
                      disabled={
                        comparison.version1 !== null &&
                        comparison.version2 !== null &&
                        comparison.version1?.id !== version.id &&
                        comparison.version2?.id !== version.id
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground dark:text-foreground">
                    #{version.version_number}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground dark:text-foreground">
                    {version.title}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground dark:text-muted-foreground">
                    {new Date(version.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground dark:text-foreground">
                    {version.created_by_username || version.created_by}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground dark:text-muted-foreground">
                    {version.comment || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => handleRestore(version.version_number.toString(), version.title)}
                      disabled={restoring === version.version_number.toString()}
                      className="rounded bg-[var(--theme-success)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--theme-success)] disabled:opacity-50"
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
        <div className="mt-8 rounded-lg bg-background p-6 shadow dark:bg-card">
          <h3 className="mb-4 text-xl font-semibold text-foreground dark:text-foreground">
            {t('blog.versionComparison') || '版本对比'}
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--theme-info)]/20 bg-[var(--theme-info-muted)] p-4 dark:border-blue-800 dark:bg-[var(--theme-info-muted)]">
              <p className="mb-2 text-sm font-medium text-blue-900 dark:text-[var(--theme-fg)]">
                版本 {comparison.version1.version_number}
              </p>
              <p className="text-sm text-foreground dark:text-foreground">{comparison.version1.title}</p>
            </div>
            <div className="rounded-lg border border-[var(--theme-success)]/20 bg-green-50 p-4 dark:border-[var(--theme-success)]/20 dark:bg-[var(--theme-success)]/15/20">
              <p className="mb-2 text-sm font-medium text-green-900 dark:text-[var(--theme-success)]">
                版本 {comparison.version2.version_number}
              </p>
              <p className="text-sm text-foreground dark:text-foreground">{comparison.version2.title}</p>
            </div>
          </div>
          <div className="space-y-4">
            {comparison.version1.title !== comparison.version2.title && (
              <div>
                <h4 className="mb-2 font-medium text-foreground dark:text-foreground">标题变更</h4>
                <div className="rounded border border-destructive/30 bg-destructive/5 p-3 dark:border-destructive/20 dark:bg-destructive/15">
                  <p className="mb-1 text-xs text-destructive dark:text-destructive">旧版本</p>
                  <p className="text-sm text-foreground dark:text-foreground line-through">
                    {comparison.version1.title}
                  </p>
                </div>
                <div className="mt-2 rounded border border-green-300 bg-green-50 p-3 dark:border-[var(--theme-success)]/20 dark:bg-[var(--theme-success)]/15/20">
                  <p className="mb-1 text-xs text-[var(--theme-success)] dark:text-[var(--theme-success)]">新版本</p>
                  <p className="text-sm text-foreground dark:text-foreground">{comparison.version2.title}</p>
                </div>
              </div>
            )}
            {comparison.version1.content !== comparison.version2.content && (
              <div>
                <h4 className="mb-2 font-medium text-foreground dark:text-foreground">内容变更</h4>
                <div className="rounded-lg border border-border bg-muted p-4 dark:border-border dark:bg-background">
                  <p className="mb-2 text-xs text-muted-foreground dark:text-muted-foreground">
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
