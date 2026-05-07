'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Save, Loader2, Globe, Server, Database, HardDrive, Activity, Mail, Zap, RefreshCw, Gauge } from 'lucide-react'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Separator } from '@/components/shadcn/ui/separator'
import { cn } from '@/lib/utils'

interface ServiceStatus { status: 'operational' | 'degraded' | 'outage'; uptime: string; description: string }
interface FeatureStatus { id: string; module: string; name: string; description: string; test_method: string; status: boolean }
interface StatusData { overall: 'operational' | 'degraded' | 'outage'; lastUpdated: string; services: Record<string, ServiceStatus>; features: FeatureStatus[] }
interface AutoTestResult { feature_id: string; feature_name: string; module: string; status: boolean; response_time_ms: number; error_message?: string; tested_at: string }
interface AutoTestData { results: AutoTestResult[]; lastRun: string | null; summary?: { total: number; passed: number; failed: number } }

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { api: Server, frontend: Globe, database: Database, redis: HardDrive, worker: Activity, email: Mail }
const SERVICE_LABELS: Record<string, string> = { api: 'API Server', frontend: 'Frontend', database: 'Database', redis: 'Redis', worker: 'Worker', email: 'Email' }
const STATUSES = [{ value: 'operational', label: '正常', color: 'bg-green-500' }, { value: 'degraded', label: '降级', color: 'bg-yellow-500' }, { value: 'outage', label: '中断', color: 'bg-red-500' }] as const

export default function AdminStatusPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [autoData, setAutoData] = useState<AutoTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/tests').then(r => r.json()),
    ]).then(([status, auto]) => { setStatusData(status); setAutoData(auto) }).finally(() => setLoading(false))
  }, [])

  const markDirty = useCallback(() => setDirty(true), [])
  const runTests = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/tests', { method: 'POST' })
      setAutoData(await res.json())
      setFeedback({ type: 'success', message: '自动化测试完成！' })
      setTimeout(() => setFeedback(null), 3000)
    } catch {
      setFeedback({ type: 'error', message: '测试运行失败' })
    } finally { setTesting(false) }
  }

  const saveAll = async () => {
    if (!statusData) return
    setSaving(true)
    try {
      const res = await fetch('/api/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusData) })
      if (!res.ok) throw new Error('Failed')
      setDirty(false)
      setFeedback({ type: 'success', message: '状态已保存！' })
      setTimeout(() => setFeedback(null), 3000)
    } catch { setFeedback({ type: 'error', message: '保存失败，请重试' }) }
    finally { setSaving(false) }
  }

  const setOverall = (s: 'operational' | 'degraded' | 'outage') => { if (!statusData) return; setStatusData({ ...statusData, overall: s }); markDirty() }
  const setServiceStatus = (name: string, status: 'operational' | 'degraded' | 'outage') => {
    if (!statusData) return; setStatusData({ ...statusData, services: { ...statusData.services, [name]: { ...statusData.services[name], status } } }); markDirty()
  }
  const toggleFeature = (id: string) => {
    if (!statusData) return; setStatusData({ ...statusData, features: statusData.features.map(f => f.id === id ? { ...f, status: !f.status } : f) }); markDirty()
  }
  const toggleAllInModule = (module: string, status: boolean) => {
    if (!statusData) return; setStatusData({ ...statusData, features: statusData.features.map(f => f.module === module ? { ...f, status } : f) }); markDirty()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  if (!statusData) return null

  const modules = new Map<string, FeatureStatus[]>()
  for (const f of statusData.features) { if (!modules.has(f.module)) modules.set(f.module, []); modules.get(f.module)!.push(f) }

  const totalDone = statusData.features.filter(f => f.status).length
  const autoPassed = autoData?.results?.filter(r => r.status).length || 0
  const autoTotal = autoData?.results?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">状态管理</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">手动控制系统状态 · 运行自动化测试 · 管理功能可用性</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={testing} variant="outline">
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            运行测试
          </Button>
          <Button onClick={saveAll} disabled={!dirty || saving} className={cn('transition-all', dirty && 'ring-2 ring-yellow-400 animate-pulse')}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {dirty ? '保存更改' : '已是最新'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className={cn('px-4 py-3 rounded-lg text-sm font-medium', feedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300')}>
          {feedback.message}
        </div>
      )}

      {/* Overall Status */}
      <Card><CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">系统整体状态</h2>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => setOverall(s.value)} className={cn('px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3', statusData.overall === s.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
              <div className={cn('w-3 h-3 rounded-full', s.color)} /><span className="font-medium">{s.label}</span>
              {statusData.overall === s.value && <Badge variant="default" className="text-xs bg-blue-500">当前</Badge>}
            </button>
          ))}
        </div>
      </CardContent></Card>

      {/* Services */}
      <Card><CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">核心服务状态</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(statusData.services).map(([key, svc]) => {
            const IconComp = SERVICE_ICONS[key] || Server
            return (<div key={key} className="text-center">
              <IconComp className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
              <p className="text-xs font-medium mb-2">{SERVICE_LABELS[key] || key}</p>
              <div className="flex justify-center gap-1">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => setServiceStatus(key, s.value)} className={cn('w-6 h-6 rounded-full transition-all', s.color, svc.status === s.value ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-30 hover:opacity-60')} title={s.label} />
                ))}
              </div>
            </div>)
          })}
        </div>
      </CardContent></Card>

      <Separator />

      {/* Auto-Test Results */}
      <Card><CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">自动化测试结果</h2>
            {autoTotal > 0 && (
              <Badge variant={autoPassed === autoTotal ? 'default' : 'destructive'} className="text-xs">{autoPassed}/{autoTotal} 通过</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {autoData?.lastRun && <span className="text-xs text-gray-400">{new Date(autoData.lastRun).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
            <Button size="sm" variant="outline" onClick={runTests} disabled={testing}>
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1', testing && 'animate-spin')} />重新测试
            </Button>
          </div>
        </div>
        {autoTotal === 0 ? (
          <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-lg">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>尚未运行自动化测试</p>
            <Button variant="outline" size="sm" onClick={runTests} className="mt-2">立即运行</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {autoData!.results.map(r => (
              <div key={r.feature_id} className="flex items-center gap-2 py-2 px-3 rounded text-sm bg-gray-50 dark:bg-gray-800/50">
                {r.status ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                <span className="flex-1 truncate">{r.feature_name}</span>
                <span className="text-xs text-gray-400 font-mono">{r.response_time_ms}ms</span>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <Separator />

      {/* Manual Features */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">手动验证</h2>
            <Badge variant="secondary" className="text-xs">{totalDone}/{statusData.features.length} 正常</Badge>
          </div>
        </div>
        <Accordion type="multiple" className="space-y-3">
          {Array.from(modules.entries()).map(([mod, features]) => {
            const cnt = features.filter(f => f.status).length; const tot = features.length
            return (<AccordionItem key={mod} value={mod} className="bg-white dark:bg-gray-900 rounded-xl border px-4 data-[state=open]:shadow-md">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  {cnt === tot ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  <span className="text-sm font-semibold">{mod}</span>
                  <Badge variant="secondary" className="text-xs">{cnt}/{tot}</Badge>
                  <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleAllInModule(mod, true)} className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200">全部正常</button>
                    <button onClick={() => toggleAllInModule(mod, false)} className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200">全部异常</button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-3">
                  {features.map(f => (<label key={f.id} className="flex items-start gap-2 py-2 px-3 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <input type="checkbox" checked={f.status} onChange={() => toggleFeature(f.id)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-400 font-mono">{f.id}</span><span className="text-sm font-medium">{f.name}</span></div>
                      {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                      {f.test_method && <code className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 mt-1 block break-all">{f.test_method}</code>}
                    </div>
                  </label>))}
                </div>
              </AccordionContent>
            </AccordionItem>)
          })}
        </Accordion>
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-50 flex justify-center">
          <Button onClick={saveAll} disabled={saving} size="lg" className="shadow-lg animate-bounce">
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}保存全部更改
          </Button>
        </div>
      )}
    </div>
  )
}
