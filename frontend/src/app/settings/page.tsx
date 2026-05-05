'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { userService } from '@/lib/api/backend'
import { GraduationCap, FlaskConical, Globe, Hash, Loader2, Settings, User, Palette } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [institution, setInstitution] = useState('')
  const [researchFieldsStr, setResearchFieldsStr] = useState('')
  const [orcidId, setOrcidId] = useState('')
  const [googleScholar, setGoogleScholar] = useState('')
  const [academicBio, setAcademicBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [twitter, setTwitter] = useState('')
  const [github, setGithub] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Fetch fresh user data from API to get full profile
  useEffect(() => {
    if (!user) return
    const loadProfile = async () => {
      try {
        const profile = await userService.getMe()
        setDisplayName(profile.display_name || '')
        setInstitution(profile.institution || '')
        setResearchFieldsStr((profile.research_fields || []).join(', '))
        setOrcidId(profile.orcid_id || '')
        setGoogleScholar(profile.google_scholar || '')
        setAcademicBio(profile.academic_bio || '')
        setWebsite(profile.website || '')
        setLocation(profile.location || '')
        setTwitter(profile.twitter || '')
        setGithub(profile.github || '')
        setProfileLoaded(true)
      } catch (err) {
        // Fallback to store data
        setDisplayName(user.username)
        setProfileLoaded(true)
      }
    }
    void loadProfile()
  }, [user])

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login?redirect=/settings')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const researchFields = researchFieldsStr
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)

      const updated = await userService.updateAcademicProfile({
        display_name: displayName || undefined,
        institution: institution || undefined,
        research_fields: researchFields.length > 0 ? researchFields : undefined,
        orcid_id: orcidId || undefined,
        google_scholar: googleScholar || undefined,
        academic_bio: academicBio || undefined,
        website: website || undefined,
        location: location || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
      })

      // Refresh auth store user
      if (setUser) setUser(updated)

      setMessage({ type: 'success', text: '个人资料已更新' })
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* ─── User Identity Banner ─── */}
      <div className="mb-8 flex items-center gap-4 rounded-xl border border-zinc-200 bg-card p-5 dark:border-zinc-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            {displayName || user?.username || '未命名用户'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              @{user?.username}
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user?.email}
            {user?.role === 'admin' && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                admin
              </span>
            )}
          </p>
        </div>
        <Link
          href={`/users/${encodeURIComponent(user?.username || '')}`}
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary dark:border-zinc-700"
        >
          查看公开主页 →
        </Link>
      </div>

      {/* ─── Quick Links ─── */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/settings/themes"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary dark:border-zinc-700"
        >
          <Palette className="h-4 w-4" />
          主题设置
        </Link>
      </div>

      {/* ─── Page Title ─── */}
      <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-foreground">
        <Settings className="h-6 w-6 text-primary" />
        个人资料设置
      </h2>
      <p className="mb-8 text-muted-foreground">
        完善你的资料和学术信息，让其他学者更容易发现你和你的作品。
      </p>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {!profileLoaded ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              显示名称
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="真实姓名或学术署名"
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Institution */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" /> 所属机构
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="学校 / 研究所 / 公司"
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Research Fields */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FlaskConical className="h-4 w-4 text-primary" /> 研究领域
            </label>
            <input
              type="text"
              value={researchFieldsStr}
              onChange={(e) => setResearchFieldsStr(e.target.value)}
              placeholder="用逗号分隔，如：机器学习, 计算机视觉, 自然语言处理"
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
            <p className="mt-1 text-xs text-muted-foreground">多个领域用英文逗号加空格分隔</p>
          </div>

          {/* ORCID */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Hash className="h-4 w-4 text-green-600" /> ORCID iD
            </label>
            <input
              type="text"
              value={orcidId}
              onChange={(e) => setOrcidId(e.target.value)}
              placeholder="0000-0001-2345-6789"
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 font-mono text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Google Scholar */}
          <div>
            <label className="mb-1.5 text-sm font-medium text-foreground">
              Google Scholar 主页
            </label>
            <input
              type="url"
              value={googleScholar}
              onChange={(e) => setGoogleScholar(e.target.value)}
              placeholder="https://scholar.google.com/citations?user=..."
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Academic Bio */}
          <div>
            <label className="mb-1.5 text-sm font-medium text-foreground">
              学术简介
            </label>
            <textarea
              value={academicBio}
              onChange={(e) => setAcademicBio(e.target.value)}
              placeholder="简要介绍你的研究方向、代表工作和学术兴趣..."
              rows={4}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Website */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Globe className="h-4 w-4 text-primary" /> 个人主页
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-zinc-300 bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存个人资料'}
          </button>
        </form>
      )}
    </div>
  )
}
