import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'

export const metadata: Metadata = {
  title: `Analytics - ${siteMetadata.title}`,
  description: 'Manage and export your blog article analytics data',
  openGraph: {
    title: `Analytics - ${siteMetadata.title}`,
    description: 'Manage and export your blog article analytics data',
  },
  twitter: {
    title: `Analytics - ${siteMetadata.title}`,
    description: 'Manage and export your blog article analytics data',
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}