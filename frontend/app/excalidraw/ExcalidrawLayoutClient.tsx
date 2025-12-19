'use client'

import { useEffect } from 'react'

export default function ExcalidrawLayoutClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hide header and other navigation elements
    const header = document.getElementById('header')
    if (header) {
      header.style.display = 'none'
    }

    // Hide any potential navigation bars
    const navElements = document.querySelectorAll('nav')
    navElements.forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })

    // Cleanup
    return () => {
      if (header) {
        header.style.display = ''
      }
      navElements.forEach((el) => {
        ;(el as HTMLElement).style.display = ''
      })
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-white">
      {children}
    </div>
  )
}
