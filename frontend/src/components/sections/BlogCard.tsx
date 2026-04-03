'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/components/lib/utils'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { ArrowRight, Calendar } from 'lucide-react'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'

interface BlogCardProps {
  content: {
    title: string
    description?: string
    publishDate: string
    tags?: string[]
    img?: string
    img_alt?: string
    slug: string
    link?: string
  }
  layout?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * BlogCard - 博客卡片组件
 * 使用shadcn组件重构，保留原有功能
 */
export default function BlogCard({ content, layout = 'vertical', className = '' }: BlogCardProps) {
  const { title, description, publishDate, tags = [], img, img_alt, slug, link } = content

  const formattedDate = new Date(publishDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const postLink = link || `/blog/${slug}`
  const isHorizontal = layout === 'horizontal'

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-500 border-2 hover:shadow-lg',
        isHorizontal && 'md:flex md:items-center',
        className
      )}
    >
      <Link href={postLink} className="absolute inset-0 z-10">
        <span className="sr-only">Read More About {title}</span>
      </Link>

      <div className={cn(isHorizontal ? 'md:flex' : '')}>
        {/* Image container */}
        <div
          className={cn(
            'relative overflow-hidden',
            isHorizontal ? 'md:w-1/2' : 'aspect-[3/2]'
          )}
        >
          <Image
            src={img || DEFAULT_COVER_IMAGE}
            alt={img_alt || (img ? `Related to ${title}` : `Default blog image for ${title}`)}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay effect on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <span className="flex h-14 w-14 translate-y-8 transform items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110 dark:bg-gray-800">
              <ArrowRight className="h-6 w-6 text-primary" />
            </span>
          </div>
        </div>

        {/* Content area */}
        <CardContent className={cn('flex flex-col p-6', isHorizontal && 'md:w-1/2')}>
          {/* Date and tags */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <time className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </time>
            {tags && tags.length > 0 && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <Badge variant="secondary" className="text-[11px]">
                  {tags[0]}
                </Badge>
              </>
            )}
          </div>

          {/* Title */}
          <Link href={postLink} className="relative z-20">
            <h2
              className={cn(
                'group-hover:text-primary mb-3 line-clamp-2 leading-tight font-bold text-foreground transition-colors duration-300',
                isHorizontal ? 'text-3xl' : 'text-2xl'
              )}
            >
              {title}
            </h2>
          </Link>

          {/* Description */}
          {description && (
            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {/* Read More button */}
          <div className="mt-auto pt-4">
            <Button variant="ghost" asChild className="group/link p-0 h-auto">
              <Link href={postLink} className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="relative">
                  Read More
                  <span className="bg-primary absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-300 group-hover/link:w-full"></span>
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
