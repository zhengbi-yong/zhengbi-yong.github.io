'use client'

import { use } from 'react'
import { TeamMemberForm } from '@/components/admin/team/TeamMemberForm'

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params in client component
  const { id } = use(params)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">编辑团队成员</h1>
      <TeamMemberForm memberId={id} />
    </div>
  )
}
