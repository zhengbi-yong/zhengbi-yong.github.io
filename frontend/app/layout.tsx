import 'css/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'
import 'leaflet/dist/leaflet.css'

import { SearchProvider, SearchConfig } from 'pliny/search'
import type { AnalyticsConfig } from 'pliny/analytics'
import Header from '@/components/Header'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import SkipLink from '@/components/SkipLink'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import LazyLoadedComponents from '@/components/LazyLoadedComponents'
import VisitorTracker from '@/components/VisitorTracker'
import I18nProvider from '@/components/I18nProvider'
import { Metadata } from 'next'
import Script from 'next/script'
import { AuthInitializer } from '@/components/auth/AuthInitializer'
import { Toaster } from '@/components/ui/Toaster'

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: 'summary_large_image',
    images: [siteMetadata.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''

  return (
    <html
      lang={siteMetadata.language}
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* The 'apple-touch-icon' link must be specified inside <head>, not here */}
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <link
        rel="mask-icon"
        href={`${basePath}/static/favicons/safari-pinned-tab.svg`}
        color="#7c1823"
      />
      <meta name="msapplication-TileColor" content="#1E3A5F" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F3F0" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1E3A5F" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body className="pl-[calc(100vw-100%)] antialiased" style={{ backgroundColor: 'var(--site-bg)', color: 'var(--text-primary)' }}>
        <Script id="load-env-variables" strategy="beforeInteractive">
          {`window["EXCALIDRAW_ASSET_PATH"] = "/";`}
        </Script>
        <I18nProvider>
          <AuthInitializer />
          <SkipLink />
          <ServiceWorkerRegister />
          <VisitorTracker />
          <ThemeProviders>
            <ErrorBoundary>
              {/* 延迟加载的组件（Analytics、KeyboardNavigation、FocusManager） */}
              <LazyLoadedComponents analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
              <SectionContainer>
                <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
                  <Header />
                  <main id="main-content" tabIndex={-1} className="mb-auto focus:outline-none">
                    {children}
                  </main>
                </SearchProvider>
                <Footer />
              </SectionContainer>
            </ErrorBoundary>
          </ThemeProviders>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  )
}
