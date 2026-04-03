'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import siteMetadata from '@/data/siteMetadata'
import socialData from '@/data/socialData'

export default function MegaFooter() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const visibleSocials = socialData.filter((s) => s.isShow)

  const navLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/music', label: 'Music' },
    { href: '/team', label: 'Team' },
  ]

  const bg = isDark ? 'bg-[#050508]' : 'bg-[#fafafa]'
  const textPrimary = isDark ? 'text-white' : 'text-gray-900'
  const textSecondary = isDark ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900'
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400'
  const textFaint = isDark ? 'text-white/30' : 'text-gray-300'
  const textFaintest = isDark ? 'text-white/20' : 'text-gray-300'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
  const lineColor = isDark ? 'bg-white/50' : 'bg-gray-400/50'
  const separatorVia = isDark ? 'via-white/10' : 'via-black/10'
  const gradientVia = isDark ? 'via-indigo-950/10' : 'via-indigo-100/30'

  return (
    <footer
      className={`relative min-h-screen flex flex-col justify-center overflow-hidden ${bg}`}
      aria-label="Footer"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${gradientVia} to-transparent pointer-events-none`} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        {/* Giant CTA Text */}
        <motion.div
          className="mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className={`font-visitor-serif leading-[0.95] tracking-tight ${textPrimary}`}
            style={{ fontSize: 'clamp(2.5rem, 7vw, 8rem)' }}
          >
            Let&apos;s Create
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Together
            </span>
          </h2>
        </motion.div>

        {/* Separator */}
        <motion.div
          className={`w-full h-px bg-gradient-to-r from-transparent ${separatorVia} to-transparent mb-10 sm:mb-14`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        {/* Navigation + Social */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-8">
          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <h3 className={`text-[10px] tracking-[0.3em] uppercase ${textMuted} mb-6`}>
              Navigate
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`group ${textSecondary} transition-colors duration-300 inline-flex items-center gap-2`}
                  >
                    <span className="text-sm tracking-wide">{link.label}</span>
                    <span className={`w-0 group-hover:w-4 h-px ${lineColor} transition-all duration-300`} />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <h3 className={`text-[10px] tracking-[0.3em] uppercase ${textMuted} mb-6`}>
              Connect
            </h3>
            <ul className="space-y-3">
              {visibleSocials.slice(0, 5).map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group ${textSecondary} transition-colors duration-300 inline-flex items-center gap-2`}
                  >
                    <span className="text-sm tracking-wide">{social.name}</span>
                    <span className={`w-0 group-hover:w-4 h-px ${lineColor} transition-all duration-300`} />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            <h3 className={`text-[10px] tracking-[0.3em] uppercase ${textMuted} mb-6`}>
              Contact
            </h3>
            {siteMetadata.email && (
              <a
                href={`mailto:${siteMetadata.email}`}
                className={`group ${textSecondary} transition-colors duration-300 inline-flex items-center gap-2`}
              >
                <span className="text-sm tracking-wide">{siteMetadata.email}</span>
                <span className={`w-0 group-hover:w-4 h-px ${lineColor} transition-all duration-300`} />
              </a>
            )}
            <div className="mt-6">
              <Link
                href={siteMetadata.github || '#'}
                target="_blank"
                rel="noreferrer"
                className={`group ${textSecondary} transition-colors duration-300 inline-flex items-center gap-2`}
              >
                <span className="text-sm tracking-wide">GitHub</span>
                <span className={`w-0 group-hover:w-4 h-px ${lineColor} transition-all duration-300`} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className={`mt-10 sm:mt-14 pt-6 border-t ${borderColor} flex flex-col items-center gap-3`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
            <span
              className={`${textFaint} text-xs`}
              style={{ fontFamily: 'var(--font-great-vibes)' }}
            >
              Zhengbi Yong
            </span>
            <span className={`${textFaintest} text-xs tracking-wider`}>
              &copy; {new Date().getFullYear()} All rights reserved
            </span>
          </div>
          <Link
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[9px] uppercase tracking-[0.1rem] transition-colors duration-300 ${
              isDark ? 'text-slate-700 hover:text-slate-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            京ICP备2025110798号-1
          </Link>
        </motion.div>
      </div>
    </footer>
  )
}
