'use client'

import Image from '@/components/Image'
import Link from '@/components/Link'
import { motion } from 'framer-motion'

interface HeroCardProps {
  imageUrl: string
  title: string
  link: string
}

/**
 * HeroCard - Hero 区域卡片组件
 * 参考 Astro 项目的 HeroCard 组件
 */
export default function HeroCard({ imageUrl, title, link }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative group"
    >
      <Link
        href={link}
        className="block overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            width={800}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
        </div>
      </Link>
    </motion.div>
  )
}

