import { ReactNode } from 'react'
import { cn } from '@/components/lib/utils'

interface Props {
  children: ReactNode
  className?: string
  variant?: 'shell' | 'content' | 'reading' | 'wide'
  as?: 'section' | 'div'
}

const variantClassMap: Record<NonNullable<Props['variant']>, string> = {
  shell: 'container-shell',
  content: 'container-content',
  reading: 'container-reading px-4 sm:px-6',
  wide: 'mx-auto w-full max-w-[96rem] px-4 sm:px-6 xl:px-8',
}

export default function SectionContainer({
  children,
  className,
  variant = 'content',
  as: Component = 'section',
}: Props) {
  return <Component className={cn(variantClassMap[variant], className)}>{children}</Component>
}
