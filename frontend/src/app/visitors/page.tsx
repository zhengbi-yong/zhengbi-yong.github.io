import { Metadata } from 'next'
import type { VisitorData } from '@/lib/types/visitor'
import VisitorMapClient from '@/components/VisitorMapClient'
import { readVisitorsFile } from '@/lib/server/visitors-file'

export const metadata: Metadata = {
  title: '访客地图',
  description: '查看网站访客的地理位置分布',
  openGraph: {
    title: '访客地图',
    description: '查看网站访客的地理位置分布',
  },
}

export const dynamic = 'force-dynamic'

async function getVisitors(): Promise<VisitorData[]> {
  try {
    return await readVisitorsFile()
  } catch (error) {
    console.error('[Visitors Page] Failed to load visitor data:', error)
    return []
  }
}

export default async function VisitorsPage() {
  let visitors = await getVisitors()

  // 开发环境：如果没有数据，添加测试数据
  if (process.env.NODE_ENV === 'development' && visitors.length === 0) {
    visitors = [
      {
        ip: '8.8.8.8',
        country: 'United States',
        city: 'Mountain View',
        lat: 37.4056,
        lon: -122.0775,
        timezone: 'America/Los_Angeles',
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        visitCount: 1,
      },
      {
        ip: '1.1.1.1',
        country: 'Australia',
        city: 'Sydney',
        lat: -33.8688,
        lon: 151.2093,
        timezone: 'Australia/Sydney',
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        visitCount: 1,
      },
    ]
  }

  // 统计信息
  const totalVisitors = visitors.length
  const uniqueCountries = new Set(visitors.map((v) => v.country)).size
  const totalVisits = visitors.reduce((sum, v) => sum + v.visitCount, 0)

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('[Visitors Page] Visitors count:', totalVisitors)
    console.log('[Visitors Page] Visitors data:', visitors)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">访客地图</h1>
        <p className="text-muted-foreground dark:text-muted-foreground">查看访问网站的用户地理位置分布</p>
      </header>

      {/* 统计信息 */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm dark:border-border dark:bg-card">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground">总访客数</h3>
          <p className="text-3xl font-bold text-foreground dark:text-foreground">{totalVisitors}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm dark:border-border dark:bg-card">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground">国家/地区数</h3>
          <p className="text-3xl font-bold text-foreground dark:text-foreground">{uniqueCountries}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm dark:border-border dark:bg-card">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground">总访问次数</h3>
          <p className="text-3xl font-bold text-foreground dark:text-foreground">{totalVisits}</p>
        </div>
      </div>

      {/* 地图 */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm dark:border-border dark:bg-card">
        <VisitorMapClient visitors={visitors} />
      </div>

      {/* 访客列表（可选） */}
      {visitors.length > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-background p-6 shadow-sm dark:border-border dark:bg-card">
          <h2 className="mb-4 text-2xl font-bold">访客列表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border">
                  <th className="px-4 py-2 text-left font-semibold">IP地址</th>
                  <th className="px-4 py-2 text-left font-semibold">位置</th>
                  <th className="px-4 py-2 text-left font-semibold">首次访问</th>
                  <th className="px-4 py-2 text-left font-semibold">最后访问</th>
                  <th className="px-4 py-2 text-left font-semibold">访问次数</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor, index) => (
                  <tr
                    key={`${visitor.ip}-${index}`}
                    className="border-b border-border hover:bg-muted dark:border-border dark:hover:bg-secondary"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{visitor.ip}</td>
                    <td className="px-4 py-2">
                      {visitor.city}, {visitor.country}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground dark:text-muted-foreground">
                      {new Date(visitor.firstVisit).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground dark:text-muted-foreground">
                      {new Date(visitor.lastVisit).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2">{visitor.visitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
