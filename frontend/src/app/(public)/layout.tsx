'use client'

import { usePathname } from 'next/navigation'
import { SearchProvider, SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import siteMetadata from '@/data/siteMetadata'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div className="overflow-x-hidden">
      <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
        <Header data-header />
        <main id="main-content" tabIndex={-1} className="mb-auto focus:outline-none">
          {children}
        </main>
      </SearchProvider>
      {/* Home page renders its own MegaFooter; show default footer on other pages */}
      {!isHome && <Footer />}
    </div>
  )
}
