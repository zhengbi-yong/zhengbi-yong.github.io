'use client'

import { SearchProvider, SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MegaFooter from '@/components/home/MegaFooter'
import siteMetadata from '@/data/siteMetadata'
import { usePathname } from 'next/navigation'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const useMegaFooter = pathname === '/'

  return (
    <div className="surface-shell flex min-h-dvh flex-col overflow-x-hidden text-[var(--text-primary)] transition-colors duration-[var(--motion-base)] dark:text-[var(--text-primary)]">
      <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
        <Header data-header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 bg-transparent pt-0 focus:outline-none"
        >
          {children}
        </main>
        {useMegaFooter ? <MegaFooter /> : <Footer />}
      </SearchProvider>
    </div>
  )
}
