/**
 * System Settings - 系统设置页面
 * 提供站点配置,邮件配置,安全设置等功能
 */

'use client'

import { useState } from 'react'
import { Save, Mail, Shield, Globe, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { DataCard } from '@/components/admin/data-card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shadcn/ui/tabs'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { Label } from '@/components/shadcn/ui/label'
import { Alert, AlertDescription } from '@/components/shadcn/ui/alert'

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      // TODO: 实现保存逻辑
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (_e) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="系统设置" description="管理系统配置和参数">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? '保存中...' : '保存设置'}
        </Button>
      </PageHeader>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-400">
            设置已保存
          </AlertDescription>
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>保存失败,请重试</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="h-4 w-4" />
            常规设置
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-4 w-4" />
            邮件配置
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <Zap className="h-4 w-4" />
            性能优化
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <DataCard title="站点配置">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="site-name">站点名称</Label>
                <Input
                  id="site-name"
                  type="text"
                  defaultValue="Zhengbi Yong's Blog"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="site-description">站点描述</Label>
                <Textarea
                  id="site-description"
                  rows={3}
                  defaultValue="个人博客和技术分享平台"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="site-url">站点 URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  defaultValue="https://yourdomain.com"
                />
              </div>
            </div>
          </DataCard>

          <DataCard title="SEO 设置">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="meta-title">默认 Meta 标题</Label>
                <Input
                  id="meta-title"
                  type="text"
                  defaultValue="Zhengbi Yong's Blog"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meta-description">默认 Meta 描述</Label>
                <Textarea
                  id="meta-description"
                  rows={3}
                  defaultValue="个人博客和技术分享平台"
                />
              </div>
            </div>
          </DataCard>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6 mt-6">
          <DataCard title="SMTP 配置">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="smtp-host">SMTP 主机</Label>
                  <Input
                    id="smtp-host"
                    type="text"
                    defaultValue="smtp.gmail.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="smtp-port">SMTP 端口</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    defaultValue="587"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sender-email">发件人邮箱</Label>
                <Input
                  id="sender-email"
                  type="email"
                  defaultValue="noreply@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-username">SMTP 用户名</Label>
                <Input
                  id="smtp-username"
                  type="text"
                  defaultValue="your-email@gmail.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-password">SMTP 密码</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="--------"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtp-tls"
                  defaultChecked
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <Label htmlFor="smtp-tls" className="font-normal">
                  启用 TLS/SSL
                </Label>
              </div>
            </div>
          </DataCard>

          <div>
            <Button variant="outline" type="button">
              发送测试邮件
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <DataCard title="密码策略">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-password-length">最小密码长度</Label>
                <Input
                  id="min-password-length"
                  type="number"
                  defaultValue="8"
                  min={6}
                  max={32}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-uppercase"
                    defaultChecked
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="require-uppercase" className="font-normal">
                    要求包含大写字母
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-lowercase"
                    defaultChecked
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="require-lowercase" className="font-normal">
                    要求包含小写字母
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-numbers"
                    defaultChecked
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="require-numbers" className="font-normal">
                    要求包含数字
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-symbols"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="require-symbols" className="font-normal">
                    要求包含特殊字符
                  </Label>
                </div>
              </div>
            </div>
          </DataCard>

          <DataCard title="登录限制">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max-login-attempts">最大登录尝试次数</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  defaultValue="5"
                  min={3}
                  max={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lockout-duration">锁定时间(分钟)</Label>
                <Input
                  id="lockout-duration"
                  type="number"
                  defaultValue="15"
                  min={5}
                  max={60}
                />
              </div>
            </div>
          </DataCard>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <DataCard title="缓存配置">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cache-ttl">缓存过期时间(秒)</Label>
                <Input
                  id="cache-ttl"
                  type="number"
                  defaultValue="3600"
                  min={60}
                  max={86400}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-cache"
                  defaultChecked
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <Label htmlFor="enable-cache" className="font-normal">
                  启用缓存
                </Label>
              </div>
            </div>
          </DataCard>

          <DataCard title="CDN 配置">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cdn-domain">CDN 域名</Label>
                <Input
                  id="cdn-domain"
                  type="url"
                  placeholder="https://cdn.yourdomain.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-cdn"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <Label htmlFor="enable-cdn" className="font-normal">
                  启用 CDN
                </Label>
              </div>
            </div>
          </DataCard>

          <DataCard title="数据库优化">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pool-size">连接池大小</Label>
                <Input
                  id="pool-size"
                  type="number"
                  defaultValue="10"
                  min={5}
                  max={50}
                />
              </div>
              <div>
                <Button variant="outline" type="button">
                  优化数据库
                </Button>
              </div>
            </div>
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
