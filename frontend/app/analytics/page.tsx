'use client'

import { useState, useRef, useEffect } from 'react'
import { useAnalyticsStorage } from '@/components/hooks/useAnalyticsStorage'
import { useTranslation } from 'react-i18next'
import { Download, Upload, Trash2, FileJson, BarChart3, Eye, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/ButtonSimple'

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { getAllData, exportData, importData, clearAllData, getDataStats, isClient } =
    useAnalyticsStorage()

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 使用 state 管理数据，确保在客户端准备好后获取并触发重新渲染
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    avgEngagement: 0,
    storageSize: 0,
  })
  const [allData, setAllData] = useState<Record<string, any>>({})

  // 在客户端准备好后获取数据
  useEffect(() => {
    if (isClient) {
      setStats(getDataStats())
      setAllData(getAllData())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient])

  // 刷新数据的辅助函数
  const refreshData = () => {
    if (isClient) {
      setStats(getDataStats())
      setAllData(getAllData())
    }
  }

  // 处理文件导入
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError(null)

    try {
      await importData(file)
      // 刷新数据而不刷新页面
      refreshData()
      alert('数据导入成功！')
    } catch (error) {
      console.error('Import failed:', error)
      setImportError(error instanceof Error ? error.message : '导入失败')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 处理清除数据
  const handleClearData = () => {
    if (confirm('确定要清除所有分析数据吗？此操作不可恢复。')) {
      clearAllData()
      // 刷新数据而不刷新页面
      refreshData()
      alert('所有数据已清除。')
    }
  }

  // 格式化存储大小
  const formatStorageSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="pt-8 pb-10 md:pt-12 md:pb-12">
        {/* 标题区域 */}
        <div className="mb-8 text-center md:mb-12">
          <h1 className="mx-auto mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl leading-tight font-extrabold tracking-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
            分析数据管理
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-400">
            管理和导出您的博客文章阅读分析数据
          </p>
        </div>

        {/* 数据统计 */}
        <div className="px-4 py-8 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">数据概览</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总文章数</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalArticles}
                </p>
              </div>
              <FileJson className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总浏览量</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalViews}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均参与度</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.avgEngagement}/100
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">存储大小</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatStorageSize(stats.storageSize)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

        {/* 数据操作 */}
        <div className="px-4 py-8 sm:px-6">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">数据操作</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={exportData}
            className="flex items-center gap-2"
            disabled={stats.totalArticles === 0}
          >
            <Download size={16} />
            导出数据
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
            disabled={importing}
          >
            <Upload size={16} />
            {importing ? '导入中...' : '导入数据'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />

          <Button
            variant="destructive"
            onClick={handleClearData}
            className="flex items-center gap-2"
            disabled={stats.totalArticles === 0}
          >
            <Trash2 size={16} />
            清除所有数据
          </Button>
        </div>

        {importError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">导入失败：{importError}</p>
          </div>
        )}
      </div>

        {/* 文章列表 */}
        {Object.keys(allData).length > 0 && (
          <div className="px-4 py-8 sm:px-6">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              文章分析详情
            </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      文章 ID
                    </th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      浏览量
                    </th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      平均阅读时间
                    </th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      滚动深度
                    </th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      参与度分数
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(allData)
                    .sort(([, a], [, b]) => b.engagementScore - a.engagementScore)
                    .map(([articleId, data]) => (
                      <tr key={articleId} className="bg-white dark:bg-gray-900">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {articleId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {data.viewCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {Math.round((data.averageReadingTime || 0) / 60)} 分钟
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((data.scrollDepth || 0) * 100)}%
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              data.engagementScore >= 80
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : data.engagementScore >= 60
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}
                          >
                            {data.engagementScore || 0}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* 说明信息 */}
        <div className="px-4 py-8 sm:px-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">说明</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>所有分析数据都存储在您的浏览器本地存储中</li>
            <li>导出功能会将所有数据保存为 JSON 文件，方便备份和迁移</li>
            <li>导入功能可以合并数据，不会覆盖现有记录</li>
            <li>参与度分数综合考虑了浏览次数、阅读时间和滚动深度</li>
            <li>清除数据操作不可恢复，请谨慎操作</li>
          </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
