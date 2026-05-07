'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Server, Globe, Database, Mail, HardDrive, Activity, Zap, Loader2, Gauge, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Badge } from '@/components/shadcn/ui/badge'
import { Separator } from '@/components/shadcn/ui/separator'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ── Types ──

interface AutoTestResult {
  feature_id: string; feature_name: string; module: string; status: boolean; response_time_ms: number; error_message?: string; tested_at: string
}
interface AutoTestData { results: AutoTestResult[]; lastRun: string | null; summary?: { total: number; passed: number; failed: number } }
interface ManualFeature { id: string; module: string; name: string; description: string; test_method: string; status: boolean }
interface ServiceStatus { status: 'operational' | 'degraded' | 'outage'; uptime: string; description: string }
interface StatusData { overall: 'operational' | 'degraded' | 'outage'; lastUpdated: string; services: Record<string, ServiceStatus>; features: ManualFeature[] }

interface AggBucket { label: string; timestamp: string; total_runs: number; fully_passed: number; partially_failed: number }
interface FailedFeature { feature_id: string; feature_name: string; module: string; error_message?: string }
interface MinuteBucket { label: string; timestamp: string; total: number; passed: number; failed: number; failed_features?: FailedFeature[] }
interface AggregatedData { granularity: string; buckets: (AggBucket | MinuteBucket)[]; year?: number; month?: number; day?: number; hour?: number }

type Granularity = 'year' | 'month' | 'day' | 'hour'

// ── Constants ──

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  api: Server, frontend: Globe, database: Database, redis: HardDrive, worker: Activity, email: Mail,
}
const SERVICE_LABELS: Record<string, string> = { api: 'API Server', frontend: 'Frontend', database: 'Database', redis: 'Redis', worker: 'Worker', email: 'Email' }
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  operational: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', icon: 'text-green-500' },
  degraded: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-500' },
  outage: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500' },
}
const GRANULARITY_LABELS: Record<Granularity, string> = { year: '年', month: '月', day: '日', hour: '时' }

// ── Helpers ──

function getDefault() {
  const now = new Date()
  return { granularity: 'day' as Granularity, year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours() }
}
function formatTitle(g: Granularity, y: number, m?: number, d?: number, h?: number) {
  if (g === 'year') return `${y} 年`
  if (g === 'month') return `${y} 年 ${m} 月`
  if (g === 'day') return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`
}

// ── Sub-components ──

function OverallBanner({ status, lastUpdated }: { status: string; lastUpdated: string }) {
  const m: Record<string, { Icon: typeof CheckCircle2; label: string; sub: string; bg: string }> = {
    operational: { Icon: CheckCircle2, label: '所有系统运行正常', sub: 'All Systems Operational', bg: 'from-green-500 to-emerald-600' },
    degraded: { Icon: AlertTriangle, label: '部分服务降级', sub: 'Partial Degradation', bg: 'from-yellow-500 to-amber-600' },
    outage: { Icon: XCircle, label: '服务中断', sub: 'Service Outage', bg: 'from-red-500 to-rose-600' },
  }
  const c = m[status] || m.operational
  const I = c.Icon
  const u = new Date(lastUpdated).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })
  return <div className={`bg-gradient-to-r ${c.bg} py-12 px-4`}><div className="max-w-6xl mx-auto text-center text-white">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-4"><I className="w-7 h-7 text-white" /></div>
    <h1 className="text-2xl md:text-3xl font-bold mb-1">{c.label}</h1><p className="text-base opacity-80">{c.sub}</p><p className="text-xs opacity-50 mt-3">最后更新: {u}</p>
  </div></div>
}

function RatioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload, t = d.total_runs || 1
  return <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
    <p className="text-green-600">✅ 全通过: {d.fully_passed || 0} 次</p>
    <p className="text-red-500">⚠️ 有异常: {d.partially_failed || 0} 次</p>
    <p className="mt-1 text-gray-400">可用率: <span className="font-semibold text-blue-600">{((d.fully_passed || 0) / t * 100).toFixed(1)}%</span></p>
  </div>
}

function MinuteTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload, ff = d.failed_features
  return <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg max-w-[300px]">
    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
    <p className="text-green-600">通过: {d.passed}</p><p className="text-red-500">失败: {d.failed}</p>
    {ff?.length > 0 && <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
      <p className="text-red-500 font-medium mb-1">故障详情:</p>
      {ff.map((f: FailedFeature, i: number) => <div key={i} className="mb-1 pl-1 border-l-2 border-red-300">
        <p className="font-medium text-gray-800 dark:text-gray-200">{f.feature_name}</p>
        <p className="text-gray-400">{f.module} · {f.feature_id}</p>
        {f.error_message && <p className="text-red-400 text-[10px] mt-0.5 break-all">{f.error_message}</p>}
      </div>)}
    </div>}
  </div>
}

// ── Main Page ──

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [autoData, setAutoData] = useState<AutoTestData | null>(null)
  const [aggData, setAggData] = useState<AggregatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  const def = getDefault()
  const [granularity, setGranularity] = useState<Granularity>(def.granularity)
  const [year, setYear] = useState(def.year)
  const [month, setMonth] = useState(def.month)
  const [day, setDay] = useState(def.day)
  const [hour, setHour] = useState(def.hour)

  // Initial load
  useEffect(() => {
    Promise.all([fetch('/api/status').then(r => r.json()), fetch('/api/tests').then(r => r.json())])
      .then(([s, a]) => { setStatusData(s); setAutoData(a) }).finally(() => setLoading(false))
  }, [])

  // Fetch aggregated chart data
  useEffect(() => {
    let cancelled = false
    setChartLoading(true)
    const p = new URLSearchParams({ granularity, year: String(year) })
    if (granularity !== 'year') p.set('month', String(month))
    if (granularity === 'day' || granularity === 'hour') p.set('day', String(day))
    if (granularity === 'hour') p.set('hour', String(hour))
    fetch(`/api/v1/status/test-history/aggregated?${p}`)
      .then(r => r.json()).then(d => { if (!cancelled) setAggData(d) })
      .catch(() => { if (!cancelled) setAggData(null) })
      .finally(() => { if (!cancelled) setChartLoading(false) })
    return () => { cancelled = true }
  }, [granularity, year, month, day, hour])

  // Drill-down
  const drill = (entry: any) => {
    const ts = new Date(entry.timestamp)
    if (isNaN(ts.getTime())) return
    switch (granularity) {
      case 'year': setGranularity('month'); setYear(ts.getFullYear()); setMonth(ts.getMonth() + 1); setDay(1); setHour(0); break
      case 'month': setGranularity('day'); setYear(ts.getFullYear()); setMonth(ts.getMonth() + 1); setDay(ts.getDate()); setHour(0); break
      case 'day': setGranularity('hour'); setYear(ts.getFullYear()); setMonth(ts.getMonth() + 1); setDay(ts.getDate()); setHour(ts.getHours()); break
    }
  }

  // Navigation
  const canNext = () => {
    const cur = new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0).getTime()
    if (granularity === 'year') return year < new Date().getFullYear()
    return cur < Date.now()
  }
  const nav = (dir: -1 | 1) => {
    switch (granularity) {
      case 'year': setYear(y => y + dir); break
      case 'month': { let m = month + dir, y = year; if (m > 12) { m = 1; y++ } if (m < 1) { m = 12; y-- }; setYear(y); setMonth(m); break }
      case 'day': { const d = new Date(year, month - 1, day + dir); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); setDay(d.getDate()); break }
      case 'hour': { const d = new Date(year, month - 1, day, hour + dir); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); setDay(d.getDate()); setHour(d.getHours()); break }
    }
  }

  // Chart data — hour view: group by minute, take worst case
  const isHour = granularity === 'hour'
  const buckets = aggData?.buckets || []
  const chartData = isHour
    ? (() => {
        const map = new Map<string, { timestamp: string; maxFailed: number; minPassed: number; failed_features: FailedFeature[] }>()
        for (const b of (buckets as MinuteBucket[])) {
          const cur = map.get(b.label)
          if (!cur) {
            map.set(b.label, { timestamp: b.timestamp, maxFailed: b.failed, minPassed: b.passed, failed_features: b.failed_features ? [...b.failed_features] : [] })
          } else {
            if (b.failed > cur.maxFailed) cur.maxFailed = b.failed
            if (b.passed < cur.minPassed) cur.minPassed = b.passed
            if (b.failed_features) {
              const ids = new Set(cur.failed_features.map(f => f.feature_id))
              for (const f of b.failed_features) { if (!ids.has(f.feature_id)) { cur.failed_features.push(f); ids.add(f.feature_id) } }
            }
          }
        }
        return Array.from(map.entries()).map(([label, e]) => ({
          label, timestamp: e.timestamp, passed: e.minPassed, failed: e.maxFailed,
          failed_features: e.failed_features.length > 0 ? e.failed_features : undefined,
        }))
      })()
    : (buckets as AggBucket[]).map(b => ({ label: b.label, timestamp: b.timestamp, total_runs: b.total_runs, fully_passed: b.fully_passed, partially_failed: b.partially_failed }))

  const totalRuns = isHour ? 0 : (buckets as AggBucket[]).reduce((s, b) => s + b.total_runs, 0)
  const totalOk = isHour ? 0 : (buckets as AggBucket[]).reduce((s, b) => s + b.fully_passed, 0)
  const uptime = totalRuns > 0 ? (totalOk / totalRuns * 100).toFixed(1) : '--'

  // ── Render ──

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (!statusData) return null

  const manByMod = new Map<string, ManualFeature[]>()
  statusData.features.forEach(f => { if (!manByMod.has(f.module)) manByMod.set(f.module, []); manByMod.get(f.module)!.push(f) })

  const autoByMod = new Map<string, AutoTestResult[]>()
  autoData?.results?.forEach(r => { if (!autoByMod.has(r.module)) autoByMod.set(r.module, []); autoByMod.get(r.module)!.push(r) })

  const ap = autoData?.results?.filter(r => r.status).length || 0
  const at = autoData?.results?.length || 0
  const lastT = autoData?.lastRun ? new Date(autoData.lastRun).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }) : null

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    <OverallBanner status={statusData.overall} lastUpdated={statusData.lastUpdated} />

    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

      {/* Core Services */}
      <section>
        <div className="flex items-center gap-3 mb-4"><Server className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">核心服务</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(statusData.services).map(([k, sv]) => {
            const IC = SERVICE_ICONS[k] || Server, cs = STATUS_COLORS[sv.status]
            return <Card key={k} className={`border-2 ${cs.border} ${cs.bg}`}><CardContent className="p-3 flex flex-col items-center text-center gap-1">
              <IC className={`w-5 h-5 ${cs.icon}`} /><p className="font-semibold text-xs text-gray-900 dark:text-white">{SERVICE_LABELS[k] || k}</p>
              <p className={`text-[11px] ${cs.text}`}>{sv.status === 'operational' ? '正常' : sv.status === 'degraded' ? '降级' : '中断'}</p>
            </CardContent></Card>
          })}
        </div>
      </section>

      <Separator />

      {/* Automated Tests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">自动化测试</h2>
            <Badge variant={ap === at ? 'default' : 'destructive'} className="text-xs">{ap}/{at} 通过</Badge>
          </div>
          {lastT && <span className="text-xs text-gray-400">上次: {lastT}</span>}
        </div>
        {autoByMod.size === 0 ? <Card className="border-dashed border-2 p-8 text-center text-gray-400"><p>尚未运行自动化测试</p></Card> :
          <Accordion type="multiple" className="space-y-2">
            {Array.from(autoByMod.entries()).map(([mod, rs]) => {
              const ok = rs.filter(r => r.status).length
              return <AccordionItem key={mod} value={mod} className="bg-white dark:bg-gray-900 rounded-lg border px-4">
                <AccordionTrigger className="py-3"><div className="flex items-center gap-2">
                  {ok === rs.length ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  <span className="text-sm font-semibold">{mod}</span><Badge variant="secondary" className="text-xs">{ok}/{rs.length}</Badge>
                </div></AccordionTrigger>
                <AccordionContent><div className="space-y-1 pb-3">
                  {rs.map(r => <div key={r.feature_id} className="flex items-center gap-2 py-2 px-3 rounded text-sm">
                    {r.status ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    <span className="flex-1">{r.feature_name}</span><span className="text-xs text-gray-400 font-mono">{r.response_time_ms}ms</span>
                    {r.error_message && <span className="text-xs text-red-400 truncate max-w-[150px]" title={r.error_message}>{r.error_message}</span>}
                  </div>)}
                </div></AccordionContent>
              </AccordionItem>
            })}
          </Accordion>
        }
      </section>

      <Separator />

      {/* Aggregated Chart */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-500" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">测试趋势</h2>
          {!isHour && <span className="text-xs text-blue-600">可用率 {uptime}%</span>}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button onClick={() => nav(-1)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center select-none">{formatTitle(granularity, year, month, day, hour)}</span>
            <button onClick={() => canNext() && nav(1)} disabled={!canNext()} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['year','month','day','hour'] as Granularity[]).map(g =>
              <button key={g} onClick={() => { setGranularity(g); if (g === 'year') { setMonth(1); setDay(1); setHour(0) } }}
                className={`px-3 py-1 text-xs font-medium rounded-md ${granularity === g ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{GRANULARITY_LABELS[g]}</button>
            )}
          </div>
        </div>

        <Card className="border p-4 bg-white dark:bg-gray-900">
          {chartLoading ? <div className="h-[250px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          : chartData.length === 0 ? <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          : <ResponsiveContainer key={`${granularity}-${chartData.length}`} width="100%" height={isHour ? 300 : 250}>
            {isHour ? <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip content={<MinuteTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="passed" name="通过" stackId="a" fill="#22c55e">{chartData.map((e: any, i: number) => <Cell key={i} radius={e.failed === 0 ? [3, 3, 3, 3] : [0, 0, 0, 0]} />)}</Bar>
              <Bar dataKey="failed" name="故障" stackId="a" fill="#ef4444">{chartData.map((e: any, i: number) => <Cell key={i} radius={e.passed === 0 ? [3, 3, 3, 3] : [3, 3, 0, 0]} />)}</Bar>
            </BarChart>
            : <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip content={<RatioTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="fully_passed" name="全通过" stackId="a" fill="#22c55e" cursor="pointer" onClick={(_: any, i: number) => drill(chartData[i])}>
                {chartData.map((e: any, i: number) => <Cell key={i} radius={e.partially_failed === 0 ? [3, 3, 3, 3] : [0, 0, 0, 0]} />)}
              </Bar>
              <Bar dataKey="partially_failed" name="有异常" stackId="a" fill="#ef4444" cursor="pointer" onClick={(_: any, i: number) => drill(chartData[i])}>
                {chartData.map((e: any, i: number) => <Cell key={i} radius={e.fully_passed === 0 ? [3, 3, 3, 3] : [3, 3, 0, 0]} />)}
              </Bar>
            </BarChart>}
          </ResponsiveContainer>}
        </Card>

        {!isHour && chartData.length > 0 && <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />全通过</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />有异常</span>
          <span className="text-gray-400">| 可用率 = 全通过次数 / 总测试次数</span>
        </div>}
      </section>

      <Separator />

      {/* Manual Tests */}
      <section>
        <div className="flex items-center gap-3 mb-4"><Gauge className="w-5 h-5 text-purple-500" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">手动验证</h2><Badge variant="outline" className="text-xs">{statusData.features.length} 项</Badge></div>
        <Accordion type="multiple" className="space-y-2">
          {Array.from(manByMod.entries()).map(([mod, fs]) => {
            const ok = fs.filter(f => f.status).length
            return <AccordionItem key={mod} value={mod} className="bg-white dark:bg-gray-900 rounded-lg border px-4">
              <AccordionTrigger className="py-3"><div className="flex items-center gap-2">
                {ok === fs.length ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm font-semibold">{mod}</span><Badge variant="secondary" className="text-xs">{ok}/{fs.length}</Badge>
              </div></AccordionTrigger>
              <AccordionContent><div className="space-y-1 pb-3">
                {fs.map(f => <div key={f.id} className="flex items-start gap-2 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {f.status ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs text-gray-400 font-mono">{f.id}</span><span className="text-sm font-medium">{f.name}</span></div>
                    {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                    {f.test_method && <code className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 mt-1 block break-all">{f.test_method}</code>}
                  </div>
                </div>)}
              </div></AccordionContent>
            </AccordionItem>
          })}
        </Accordion>
      </section>

      <div className="text-center text-xs text-gray-400 pb-8">
        自动测试数据持久化至 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">data/auto-test-results.json</code> · <Link href="/admin/status" className="text-blue-500 hover:underline">管理状态</Link>
      </div>
    </div>
  </div>
}
