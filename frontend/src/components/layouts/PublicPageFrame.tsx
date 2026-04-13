import { ReactNode } from 'react'

interface PublicPageFrameProps {
  children: ReactNode
  outerClassName?: string
  innerClassName?: string
}

export default function PublicPageFrame({
  children,
  outerClassName = '',
  innerClassName = '',
}: PublicPageFrameProps) {
  return (
    <div className={`relative min-h-screen ${outerClassName}`.trim()}>
      <div className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className={`mx-auto max-w-6xl px-6 md:px-12 ${innerClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )
}
