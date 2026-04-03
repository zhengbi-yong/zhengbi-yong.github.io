'use client'

import { useEffect, useRef } from 'react'

interface MusicOSMDRendererProps {
  musicUrl: string
  isDark: boolean
}

export default function MusicOSMDRenderer({ musicUrl, isDark }: MusicOSMDRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    async function loadAndRender() {
      if (!containerRef.current) return

      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay')

        if (!mounted || !containerRef.current) return

        if (osmdRef.current) {
          osmdRef.current.clear()
        }

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawComposer: true,
          drawCredits: false,
          drawPartNames: false,
          drawFingerings: false,
          drawMeasureNumbers: false,
          drawingParameters: 'compact',
        })

        osmdRef.current = osmd

        if (musicUrl.endsWith('.mxl')) {
          // .mxl is a compressed zip archive. OSMD can fetch and
          // decompress it internally when given the URL directly.
          await osmd.load(musicUrl)
        } else {
          // .xml files: fetch the plain text and pass to OSMD.
          const response = await fetch(musicUrl)
          if (!response.ok) throw new Error(`Failed to fetch ${musicUrl}: ${response.status}`)
          const content = await response.text()
          await osmd.load(content)
        }
        if (mounted) {
          osmd.render()
          // Apply theme colors to rendered SVG
          if (isDark && containerRef.current) {
            const svg = containerRef.current.querySelector('svg')
            if (svg) {
              svg.querySelectorAll('g').forEach((g) => {
                const el = g as SVGGElement
                if (el.style) {
                  el.style.fill = el.style.fill === 'black' ? '#d4a574' : el.style.fill
                }
              })
              svg.querySelectorAll('path').forEach((p) => {
                const el = p as SVGPathElement
                if (el.getAttribute('stroke') === 'black') {
                  el.setAttribute('stroke', '#8b7355')
                }
              })
            }
          }
        }
      } catch (err) {
        // MusicXML file might not exist - show fallback
        if (containerRef.current && mounted) {
          containerRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48 gap-4 opacity-40">
              <div class="text-4xl">♪</div>
              <div class="text-xs tracking-widest uppercase">Score Preview</div>
            </div>
          `
        }
      }
    }

    loadAndRender()

    return () => {
      mounted = false
      if (osmdRef.current) {
        osmdRef.current.clear()
      }
    }
  }, [musicUrl, isDark])

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[200px]"
      style={{ color: isDark ? '#d4a574' : '#1a1a1a' }}
    />
  )
}
