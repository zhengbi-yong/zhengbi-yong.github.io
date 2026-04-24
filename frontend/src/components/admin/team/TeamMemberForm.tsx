'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminService } from '@/lib/api/backend'
import type {
  CreateTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamRole,
} from '@/lib/types/backend'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

interface TeamMemberFormProps {
  memberId?: string
  onSuccess?: () => void
}

export function TeamMemberForm({ memberId, onSuccess }: TeamMemberFormProps) {
  const router = useRouter()
  const isEditing = !!memberId

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<CreateTeamMemberRequest>({
    name: '',
    name_en: '',
    team_role: 'member',
    title: '',
    bio: '',
    affiliation: '',
    research_tags: [],
    email: '',
    github: '',
    website: '',
    avatar_media_id: undefined,
    display_order: 0,
  })

  const [researchInput, setResearchInput] = useState('')

  useEffect(() => {
    if (memberId) {
      loadMember()
    }
  }, [memberId])

  const loadMember = async () => {
    try {
      const member = await adminService.getTeamMemberDetail(memberId!)
      setFormData({
        name: member.name,
        name_en: member.name_en || '',
        team_role: member.team_role,
        title: member.title || '',
        bio: member.bio || '',
        affiliation: member.affiliation || '',
        research_tags: member.research_tags || [],
        email: member.email || '',
        github: member.github || '',
        website: member.website || '',
        avatar_media_id: undefined, // Avatar handling would require media resolution
        display_order: member.display_order,
      })
    } catch (_) {
      alert('加载成员信息失败')
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('请输入姓名')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await adminService.updateTeamMember(memberId!, formData as UpdateTeamMemberRequest)
      } else {
        await adminService.createTeamMember(formData)
      }
      onSuccess?.()
      router.push('/admin/team')
    } catch (_) {
      alert(isEditing ? '更新失败' : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const addResearchTag = () => {
    const tag = researchInput.trim()
    if (tag && !formData.research_tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        research_tags: [...(prev.research_tags || []), tag],
      }))
    }
    setResearchInput('')
  }

  const removeResearchTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      research_tags: prev.research_tags?.filter(t => t !== tag),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本信息</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入姓名"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_en">英文名</Label>
            <Input
              id="name_en"
              value={formData.name_en || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              placeholder="English name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team_role">角色</Label>
            <select
              id="team_role"
              value={formData.team_role || 'member'}
              onChange={(e) => setFormData(prev => ({ ...prev, team_role: e.target.value as TeamRole }))}
              className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="advisor">导师</option>
              <option value="lead">负责人</option>
              <option value="member">成员</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_order">显示顺序</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">职位/头衔</Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="如：教授，博士生导师"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="affiliation">机构</Label>
          <Input
            id="affiliation"
            value={formData.affiliation || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
            placeholder="如：北京理工大学"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">个人简介</h3>
        <div className="space-y-2">
          <Label htmlFor="bio">简介</Label>
          <Textarea
            id="bio"
            value={formData.bio || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="输入个人简介..."
            rows={4}
          />
        </div>
      </div>

      {/* Research Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">研究方向</h3>
        <div className="flex gap-2">
          <Input
            value={researchInput}
            onChange={(e) => setResearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchTag())}
            placeholder="输入研究方向后按回车添加"
          />
          <Button type="button" variant="outline" onClick={addResearchTag}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.research_tags?.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeResearchTag(tag)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">联系方式</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={formData.github || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">网站</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? '保存中...' : (isEditing ? '保存更改' : '创建成员')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/team')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>
    </form>
  )
}
