import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses: Record<NonNullable<LoaderProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export const Loader = ({ size = 'md', className = '' }: LoaderProps) => {
  return <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
}

export default Loader
