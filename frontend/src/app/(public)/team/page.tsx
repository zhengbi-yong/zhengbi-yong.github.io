'use client'

import { useEffect, useState } from 'react'
import { genPageMetadata } from '@/app/seo'
import { teamService } from '@/lib/api/backend'
import type { TeamMemberListItem } from '@/lib/types/backend'

export const metadata = genPageMetadata({ title: 'Team' })

export default function TeamPage() {
  const [advisorMembers, setAdvisorMembers] = useState<TeamMemberListItem[]>([])
  const [coreMembers, setCoreMembers] = useState<TeamMemberListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeam() {
      try {
        const members = await teamService.getTeamMembers()

        // Filter by role
        const advisors = members.filter(m => m.team_role === 'advisor')
        const leads = members.filter(m => m.team_role === 'lead')
        const memberOnly = members.filter(m => m.team_role === 'member')

        // Leads and members go together under "团队成员"
        setAdvisorMembers(advisors)
        setCoreMembers([...leads, ...memberOnly])
      } catch (error) {
        console.error('Failed to load team members:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTeam()
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            <div className="flex items-center justify-center py-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasAdvisors = advisorMembers.length > 0
  const hasCoreMembers = coreMembers.length > 0

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          {/* Team Grid */}
          <section>
            {/* Advisor section */}
            {hasAdvisors && (
              <div className="mb-16 md:mb-24">
                <h2
                  className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500 md:mb-14"
                >
                  指导教师
                </h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
                  {advisorMembers.map((member) => (
                    <article key={member.id} className="group">
                      <div className="bg-zinc-50 p-8 transition-all duration-500 group-hover:bg-zinc-100 dark:bg-zinc-900/50 dark:group-hover:bg-zinc-800/50 md:p-10">
                        <div className="flex gap-8">
                          <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <span
                              className="text-3xl font-light text-amber-700 dark:text-amber-400"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name}
                            </h3>
                            {member.name_en && (
                              <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
                                {member.name_en}
                              </p>
                            )}
                            <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-500">
                              {member.title}
                              {member.affiliation && ` · ${member.affiliation}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Core Members section */}
            {hasCoreMembers && (
              <div>
                <h2
                  className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500 md:mb-14"
                >
                  团队成员
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                  {coreMembers.map((member) => (
                    <article key={member.id} className="group">
                      <div className="h-full bg-zinc-50 p-6 transition-all duration-500 group-hover:bg-zinc-100 dark:bg-zinc-900/50 dark:group-hover:bg-zinc-800/50 md:p-8">
                        <div className="flex items-center gap-5">
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <span
                              className="text-xl font-light text-amber-700 dark:text-amber-400"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {member.name}
                            </h3>
                            {member.name_en && (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                {member.name_en}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-medium text-amber-700/70 dark:text-amber-500/60">
                            {member.title}
                            {member.affiliation && ` · ${member.affiliation}`}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasAdvisors && !hasCoreMembers && (
              <div className="py-32 text-center">
                <p className="text-zinc-400 dark:text-zinc-500">暂无团队成员</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
