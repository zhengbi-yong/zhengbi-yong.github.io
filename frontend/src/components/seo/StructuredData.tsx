'use client'


interface StructuredDataProps {
  type: 'Article' | 'BlogPosting' | 'Organization' | 'Person' | 'WebSite' | 'BreadcrumbList'
  data: Record<string, any>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  // 生成不同类型的结构化数据
  const generateStructuredData = () => {
    const baseStructure = {
      '@context': 'https://schema.org',
      ...data,
    }

    switch (type) {
      case 'Article':
      case 'BlogPosting':
        return {
          ...baseStructure,
          '@type': 'BlogPosting',
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
          },
          headline: data.title,
          description: data.description,
          image: data.image ? [data.image] : undefined,
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          author: {
            '@type': 'Person',
            name: data.author,
            url: data.authorUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: data.publisher || "Zhengbi Yong's Blog",
            logo: {
              '@type': 'ImageObject',
              url: data.publisherLogo || '/logo.png',
            },
          },
        }

      case 'Organization':
        return {
          ...baseStructure,
          '@type': 'Organization',
          name: data.name,
          url: data.url,
          logo: data.logo,
          sameAs: data.sameAs,
          contactPoint: data.contactPoint,
        }

      case 'Person':
        return {
          ...baseStructure,
          '@type': 'Person',
          name: data.name,
          url: data.url,
          image: data.image,
          jobTitle: data.jobTitle,
          worksFor: data.worksFor,
          sameAs: data.sameAs,
        }

      case 'WebSite':
        return {
          ...baseStructure,
          '@type': 'WebSite',
          name: data.name,
          url: data.url,
          description: data.description,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${data.url}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }

      case 'BreadcrumbList':
        return {
          ...baseStructure,
          '@type': 'BreadcrumbList',
          itemListElement: data.items?.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }

      default:
        return baseStructure
    }
  }

  const structuredData = generateStructuredData()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  )
}

// 文章结构化数据组件
export function ArticleStructuredData({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  authorUrl,
  tags,
}: {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  author: string
  authorUrl?: string
  tags?: string[]
}) {
  return (
    <StructuredData
      type="BlogPosting"
      data={{
        title,
        description,
        url,
        image,
        datePublished,
        dateModified,
        author,
        authorUrl,
        keywords: tags?.join(', '),
      }}
    />
  )
}

// 面包屑结构化数据组件
export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  return <StructuredData type="BreadcrumbList" data={{ items }} />
}

// 网站结构化数据组件
export function WebSiteStructuredData({
  name,
  url,
  description,
}: {
  name: string
  url: string
  description: string
}) {
  return <StructuredData type="WebSite" data={{ name, url, description }} />
}
