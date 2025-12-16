import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'

export const metadata: Metadata = {
  title: `Popular Articles - ${siteMetadata.title}`,
  description: 'Most popular and trending articles based on reader engagement',
  openGraph: {
    title: `Popular Articles - ${siteMetadata.title}`,
    description: 'Most popular and trending articles based on reader engagement',
  },
  twitter: {
    title: `Popular Articles - ${siteMetadata.title}`,
    description: 'Most popular and trending articles based on reader engagement',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
