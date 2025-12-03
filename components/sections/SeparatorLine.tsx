import { cn } from '@/components/lib/utils'

interface SeparatorLineProps {
  className?: string
  color?: string
  width?: 'full' | '3/4' | '1/2' | '1/4'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  thickness?: 'thin' | 'normal' | 'thick'
}

// Width mapping
const widthClasses = {
  full: 'w-full',
  '3/4': 'w-3/4',
  '1/2': 'w-1/2',
  '1/4': 'w-1/4',
}

// Spacing mapping
const spacingClasses = {
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-8',
  xl: 'my-12',
}

// Thickness mapping
const thicknessClasses = {
  thin: 'border-[0.5px]',
  normal: 'border-[1px]',
  thick: 'border-[2px]',
}

/**
 * SeparatorLine - 分隔线组件
 * 参考 Astro 项目的 SeparatorLine 组件，适配项目现有风格
 * 支持自定义宽度、间距、厚度和颜色
 */
export default function SeparatorLine({
  className = '',
  color = 'border-primary/25 dark:border-primary/25',
  width = 'full',
  spacing = 'md',
  thickness = 'thin',
}: SeparatorLineProps) {
  return (
    <div
      className={cn(
        'mx-auto',
        widthClasses[width],
        spacingClasses[spacing],
        thicknessClasses[thickness],
        color,
        'border-dashed',
        className
      )}
      aria-hidden="true"
    />
  )
}

