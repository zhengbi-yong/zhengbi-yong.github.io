import { genPageMetadata } from '@/app/seo'
import Link from 'next/link'
import PublicLayout from '@/app/(public)/layout'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'

export const metadata = genPageMetadata({ title: 'Lab — Experiments & Playground' })

const labProjects = [
  {
    title: 'Excalidraw',
    description: 'Hand-drawn style diagramming and whiteboarding.',
    href: '/lab/excalidraw',
    icon: '✏️',
  },
  {
    title: 'Music',
    description: 'Music sheets, audio experiments, and sound design.',
    href: '/lab/music',
    icon: '🎵',
  },
  {
    title: 'Experiment',
    description: 'Miscellaneous experiments and prototypes.',
    href: '/lab/experiment',
    icon: '🧪',
  },
]

export default function LabPage() {
  return (
    <PublicLayout>
      <PublicPageFrame>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">🧪 Lab</h1>
          <p className="mb-12 text-lg" style={{ color: 'var(--theme-fg-secondary)' }}>
            Experiments, prototypes, and playgrounds. Things may break here — enter at your own risk.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {labProjects.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="group block rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg)',
                }}
              >
                <div className="mb-3 text-3xl">{project.icon}</div>
                <h2
                  className="mb-1 text-xl font-semibold transition-colors group-hover:underline"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {project.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-fg-secondary)' }}>
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </PublicPageFrame>
    </PublicLayout>
  )
}
