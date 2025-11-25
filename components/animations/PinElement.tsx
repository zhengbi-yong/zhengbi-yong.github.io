'use client'

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface PinElementProps {
  children: ReactNode
  className?: string
  pinSpacing?: boolean
  start?: string
  end?: string
  onPinStart?: () => void
  onPinEnd?: () => void
}

export default function PinElement({
  children,
  className = '',
  pinSpacing = true,
  start = 'top top',
  end = '+=100%',
  onPinStart,
  onPinEnd,
}: PinElementProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return

    const element = ref.current

    ScrollTrigger.create({
      trigger: element,
      pin: true,
      pinSpacing,
      start,
      end,
      onEnter: () => {
        onPinStart?.()
      },
      onLeave: () => {
        onPinEnd?.()
      },
      onEnterBack: () => {
        onPinStart?.()
      },
      onLeaveBack: () => {
        onPinEnd?.()
      },
    })
  }, [pinSpacing, start, end, onPinStart, onPinEnd])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

