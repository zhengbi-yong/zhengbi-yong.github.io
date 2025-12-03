'use client'

import { motion } from 'framer-motion'
import SocialIcon from '@/components/social-icons'
import siteMetadata from '@/data/siteMetadata'

interface SocialCardProps {
  displaySocialIds?: number[]
}

/**
 * SocialCard - 社交媒体卡片组件
 * 参考 Astro 项目的 SocialCard 组件
 */
export default function SocialCard({ displaySocialIds = [1, 2, 3, 4] }: SocialCardProps) {
  const socialLinks = [
    { kind: 'github' as const, href: siteMetadata.github },
    { kind: 'x' as const, href: siteMetadata.x },
    { kind: 'linkedin' as const, href: siteMetadata.linkedin },
    { kind: 'mail' as const, href: `mailto:${siteMetadata.email}` },
  ]

  const displayedLinks = displaySocialIds
    .map((id) => socialLinks[id - 1])
    .filter((link) => link && link.href)

  return (
    <div className="flex items-center gap-4">
      {displayedLinks.map((link, index) => (
        <motion.div
          key={link.kind}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
        >
          <SocialIcon kind={link.kind} href={link.href} size={6} />
        </motion.div>
      ))}
    </div>
  )
}

