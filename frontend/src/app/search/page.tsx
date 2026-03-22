import { genPageMetadata } from '@/app/seo'
import SearchPageClient from './SearchPageClient'

export const metadata = genPageMetadata({
  title: 'Search',
  description: 'Search published posts with Meilisearch-backed results.',
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams

  return <SearchPageClient initialQuery={params.q ?? ''} />
}
