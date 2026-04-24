import { TeamMemberForm } from '@/components/admin/team/TeamMemberForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '添加成员 - 团队管理',
}

export default function NewTeamMemberPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">添加团队成员</h1>
      <TeamMemberForm />
    </div>
  )
}
