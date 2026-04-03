import '@/styles/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'
import 'leaflet/dist/leaflet.css'
import 'katex/dist/katex.min.css' // KaTeX 数学公式样式
import 'abcjs/abcjs-audio.css'

import type { AnalyticsConfig } from 'pliny/analytics'
import SkipLink from '@/components/SkipLink'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import LazyLoadedComponents from '@/components/LazyLoadedComponents'
import VisitorTracker from '@/components/VisitorTracker'
import I18nProvider from '@/components/I18nProvider'
import { Inter, JetBrains_Mono, Newsreader, Great_Vibes } from 'next/font/google'
import { Metadata } from 'next'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-great-vibes',
  weight: '400',
})

import Script from 'next/script'
import { AuthInitializer } from '@/components/auth/AuthInitializer'
import { Toaster } from '@/components/shadcn/ui/sonner'
import { QueryProvider } from '@/lib/providers/query-provider'

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/static/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/static/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/static/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable} ${greatVibes.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          precedence="default"
        />
      </head>
      <body
        className="pl-[calc(100vw-100%)] antialiased"
        style={{ backgroundColor: 'var(--site-bg)', color: 'var(--text-primary)' }}
      >
        <Script id="load-env-variables" strategy="beforeInteractive">
          {`window["EXCALIDRAW_ASSET_PATH"] = "/";`}
        </Script>
        <QueryProvider>
          <I18nProvider>
            <AuthInitializer />
            <SkipLink />
            <ServiceWorkerRegister />
            <VisitorTracker />
            <ThemeProviders>
              <ErrorBoundary>
                {/* 延迟加载的组件（Analytics、KeyboardNavigation、FocusManager） */}
                <LazyLoadedComponents analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
                {children}
              </ErrorBoundary>
            </ThemeProviders>
          </I18nProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
