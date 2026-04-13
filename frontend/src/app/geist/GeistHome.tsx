import { GeistLayout } from '@/components/geist'
import { GeistButton } from '@/components/geist'
import { GeistBadge } from '@/components/geist'
import Link from 'next/link'
import { ArrowRight, BookOpen, Code, Users, Music } from 'lucide-react'

// Recent posts data - in production this would come from customFetch()
const recentPosts = [
  {
    slug: 'understanding-rust-async',
    title: 'Understanding Rust Async Runtime',
    excerpt: 'Deep dive into tokio, async/await patterns, and building high-performance systems.',
    date: '2026-04-08',
    tags: ['Rust', 'Async'],
    readTime: 8,
  },
  {
    slug: 'nextjs-16-features',
    title: 'Next.js 16 New Features',
    excerpt: 'Exploring the new features in Next.js 16 including improved server components.',
    date: '2026-04-05',
    tags: ['Next.js', 'React'],
    readTime: 6,
  },
  {
    slug: 'postgresql-18-optimization',
    title: 'PostgreSQL 18 Performance Tuning',
    excerpt: 'Advanced optimization techniques for PostgreSQL 18 including UUIDv7 and HOT updates.',
    date: '2026-04-01',
    tags: ['Database', 'PostgreSQL'],
    readTime: 12,
  },
]

const stats = [
  { label: 'Articles', value: '42', icon: BookOpen },
  { label: 'Projects', value: '15', icon: Code },
  { label: 'Team Members', value: '6', icon: Users },
  { label: 'Music Pieces', value: '28', icon: Music },
]

const sections = [
  {
    title: 'Blog',
    description:
      'Technical articles on software engineering, system design, and emerging technologies.',
    href: '/blog',
    icon: BookOpen,
  },
  {
    title: 'Projects',
    description:
      'Open source projects showcasing robotics, web development, and creative experiments.',
    href: '/projects',
    icon: Code,
  },
  {
    title: 'Team',
    description: 'Meet the researchers and engineers behind this technical blog.',
    href: '/team',
    icon: Users,
  },
  {
    title: 'Music',
    description: 'Original compositions and music theory explorations.',
    href: '/music',
    icon: Music,
  },
]

export default function GeistHome() {
  return (
    <GeistLayout hideHeader hideFooter>
      <div className="w-full">
        {/* Hero Section */}
        <section className="w-full px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <h1
                className="font-geist-sans text-5xl font-bold tracking-tight text-[var(--geist-fg)] md:text-6xl"
                style={{ letterSpacing: '-0.04em' }}
              >
                Engineering
                <br />
                <span className="text-[var(--geist-fg-secondary)]">Excellence</span>
              </h1>
              <p
                className="font-geist-sans mt-6 max-w-xl text-lg text-[var(--geist-fg-secondary)] md:text-xl"
                style={{ letterSpacing: '-0.01em' }}
              >
                A technical blog by Beijing Institute of Technology researchers exploring robotics,
                multimodal perception, and modern software architecture.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/blog">
                  <GeistButton size="lg" className="gap-2">
                    Read Articles
                    <ArrowRight className="h-4 w-4" />
                  </GeistButton>
                </Link>
                <Link href="/projects">
                  <GeistButton variant="ghost" size="lg">
                    View Projects
                  </GeistButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full border-y border-[var(--geist-border)] bg-[var(--geist-bg-secondary)] px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--geist-muted)]">
                      <Icon className="h-5 w-5 text-[var(--geist-fg-secondary)]" />
                    </div>
                    <div className="text-center">
                      <p className="font-geist-sans text-2xl font-bold text-[var(--geist-fg)]">
                        {stat.value}
                      </p>
                      <p className="font-geist-sans text-sm text-[var(--geist-fg-secondary)]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Recent Posts Section */}
        <section className="w-full px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-between">
              <h2
                className="font-geist-sans text-2xl font-bold tracking-tight text-[var(--geist-fg)] md:text-3xl"
                style={{ letterSpacing: '-0.03em' }}
              >
                Recent Articles
              </h2>
              <Link href="/blog">
                <GeistButton variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </GeistButton>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {recentPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group rounded-lg border border-[var(--geist-border)] p-6 transition-colors hover:border-[var(--geist-border-strong)]"
                >
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <GeistBadge key={tag} variant="secondary">
                        {tag}
                      </GeistBadge>
                    ))}
                    <span className="font-geist-sans text-xs text-[var(--geist-fg-tertiary)]">
                      {post.readTime} min read
                    </span>
                  </div>
                  <h3 className="font-geist-sans text-lg font-semibold text-[var(--geist-fg)] transition-colors group-hover:text-[var(--geist-fg-secondary)]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="font-geist-sans mt-2 line-clamp-2 text-sm text-[var(--geist-fg-secondary)]">
                    {post.excerpt}
                  </p>
                  <time className="font-geist-sans mt-4 block text-xs text-[var(--geist-fg-tertiary)]">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Explore Sections */}
        <section className="w-full border-t border-[var(--geist-border)] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <h2
              className="font-geist-sans mb-12 text-2xl font-bold tracking-tight text-[var(--geist-fg)] md:text-3xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              Explore
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="group flex flex-col gap-4 rounded-lg border border-[var(--geist-border)] p-6 transition-all hover:border-[var(--geist-border-strong)] hover:bg-[var(--geist-muted)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--geist-bg-secondary)] transition-colors group-hover:bg-[var(--geist-muted)]">
                      <Icon className="h-5 w-5 text-[var(--geist-fg-secondary)]" />
                    </div>
                    <div>
                      <h3 className="font-geist-sans text-base font-semibold text-[var(--geist-fg)] transition-colors group-hover:text-[var(--geist-fg-secondary)]">
                        {section.title}
                      </h3>
                      <p className="font-geist-sans mt-1 text-sm text-[var(--geist-fg-secondary)]">
                        {section.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </GeistLayout>
  )
}
