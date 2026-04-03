'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'
import projectsData from '@/data/projectsData'

export default function ProjectGallery() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => setIsDragging(false)
  const handleMouseLeave = () => setIsDragging(false)

  const accentColor = isDark ? 'text-amber-300' : 'text-amber-600'
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const textColor = isDark ? 'text-gray-100' : 'text-gray-800'

  return (
    <section className="relative py-24 sm:py-32" aria-label="Projects">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          className="mb-12 flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <span className={`text-xs tracking-[0.3em] uppercase ${mutedColor} block mb-2`}>
              Projects
            </span>
            <h2 className={`font-visitor-serif text-3xl sm:text-4xl ${textColor}`}>
              Selected Work
            </h2>
          </div>
          <span className={`text-xs tracking-[0.2em] uppercase ${mutedColor} hidden sm:block`}>
            Drag to explore →
          </span>
        </motion.div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex gap-6 px-4 sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
          {projectsData.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={index}
              isDark={isDark}
              accentColor={accentColor}
              mutedColor={mutedColor}
              textColor={textColor}
            />
          ))}

          {/* View All Card */}
          <motion.div
            className="flex-shrink-0 w-[300px] sm:w-[400px] flex items-center justify-center"
            style={{ scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <Link
              href="/projects"
              className={`group flex flex-col items-center gap-4 p-8 rounded-3xl border transition-all duration-500 ${
                isDark
                  ? 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.02]'
                  : 'border-black/[0.06] hover:border-black/[0.12] hover:bg-black/[0.01]'
              }`}
            >
              <span className={`text-4xl transition-transform duration-300 group-hover:scale-110 ${accentColor}`}>
                →
              </span>
              <span className={`text-sm tracking-[0.2em] uppercase ${mutedColor}`}>
                View All Projects
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

interface ProjectCardProps {
  project: (typeof projectsData)[number]
  index: number
  isDark: boolean
  accentColor: string
  mutedColor: string
  textColor: string
}

function ProjectCard({ project, index, isDark, accentColor, mutedColor, textColor }: ProjectCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -10, y: x * 10 })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <motion.div
      className="flex-shrink-0 w-[300px] sm:w-[400px]"
      style={{ scrollSnapAlign: 'start' }}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.7 }}
    >
      <Link href={project.href || '#'} className="block group">
        <div
          className="relative aspect-[4/5] rounded-3xl overflow-hidden transition-transform duration-300 ease-out"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: isDark
              ? `0 25px 50px rgba(0,0,0,0.5), ${tilt.y * 2}px ${-tilt.x * 2}px 30px rgba(99,102,241,0.1)`
              : `0 25px 50px rgba(0,0,0,0.1), ${tilt.y * 2}px ${-tilt.x * 2}px 30px rgba(99,102,241,0.05)`,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Project Image */}
          <Image
            src={project.imgSrc || DEFAULT_COVER_IMAGE}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isDark
              ? 'bg-gradient-to-t from-[#0A0A0F]/90 via-[#0A0A0F]/30 to-transparent'
              : 'bg-gradient-to-t from-white/90 via-white/30 to-transparent'
          }`} />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              {project.category && (
                <span className={`text-xs tracking-[0.2em] uppercase ${accentColor}`}>
                  {project.category}
                </span>
              )}
              {project.year && (
                <span className={`text-xs ${mutedColor}`}>
                  · {project.year}
                </span>
              )}
            </div>
            <h3 className={`font-visitor-serif text-lg sm:text-xl ${textColor} mb-2 line-clamp-2`}>
              {project.title}
            </h3>
            <p className={`text-sm ${mutedColor} line-clamp-2`}>
              {project.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
