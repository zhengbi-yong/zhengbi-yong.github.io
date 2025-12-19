'use client'

import * as React from 'react'
import Link from '@/components/Link'
import { cn } from '@/components/lib/utils'

export interface ButtonProps {
  url?: string // Button link URL (optional for button mode)
  type?: 'solid' | 'fill' | 'disabled' // Button type, optional, default is "solid"
  className?: string // Custom CSS classes
  target?: '_blank' | '_self' | '_parent' | '_top' // Link target, default is "_self"
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' // Button size, optional, default is "md"
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void // Click handler
  disabled?: boolean // Disable state
  ariaLabel?: string // ARIA label for accessibility
  ariaDescribedBy?: string // ARIA describedby
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' // Button variant for semantic meaning
  loading?: boolean // Loading state
  icon?: React.ReactNode // Icon to display
  iconPosition?: 'left' | 'right' // Icon position
}

// Define padding and font size for different button sizes
const sizeClasses = {
  xs: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-xs',
    borderRadius: 'rounded-lg',
  },
  sm: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    borderRadius: 'rounded-lg',
  },
  md: {
    padding: 'px-5 py-[12px]',
    fontSize: 'text-base',
    borderRadius: 'rounded-xl',
  },
  lg: {
    padding: 'px-6 py-3.5',
    fontSize: 'text-lg',
    borderRadius: 'rounded-xl',
  },
  xl: {
    padding: 'px-8 py-4',
    fontSize: 'text-xl',
    borderRadius: 'rounded-2xl',
  },
}

/**
 * Button - 参考 Astro 项目的 Button 组件
 * 支持 solid、fill、disabled 三种类型
 * 支持 xs、sm、md、lg、xl 五种尺寸
 */
export default function Button({
  url,
  type = 'solid',
  className = '',
  target = '_self',
  size = 'md',
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  loading = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const currentSizeClasses = sizeClasses[size]

  // 基础样式类
  const baseClasses =
    'flex justify-center items-center flex-grow-0 flex-shrink-0 relative gap-1.5 max-w-60 transition-all duration-300 ease-in-out'

  // 根据类型设置样式
  const getTypeClasses = () => {
    if (type === 'solid') {
      return cn(
        baseClasses,
        currentSizeClasses.padding,
        currentSizeClasses.borderRadius,
        'bg-gradient-to-b from-white to-[#edf1fa] dark:from-[#15233b] dark:to-[#0f1b2d]',
        'border-[1px] border-primary/20 dark:border-[#243757]',
        'hover:translate-y-[-2px] hover:shadow-[0px_6px_9px_0_rgba(61,99,171,0.15)] dark:hover:shadow-[0px_6px_9px_0_rgba(59,123,217,0.25)]'
      )
    }

    if (type === 'fill') {
      return cn(
        baseClasses,
        currentSizeClasses.padding,
        currentSizeClasses.borderRadius,
        'bg-primary-600 dark:bg-primary-500',
        'border-0 border-[rgba(138,127,255,0.2)]',
        'shadow-[0px_2px_3px_0_rgba(0,0,0,0.1)]',
        'hover:bg-primary-700 dark:hover:bg-primary-600',
        'hover:translate-y-[-2px] hover:shadow-[0px_6px_9px_0_rgba(61,99,171,0.15)]',
        'dark:shadow-[0px_6px_9px_0_rgba(0,0,0,0.2)]'
      )
    }

    if (type === 'disabled') {
      return cn(
        baseClasses,
        currentSizeClasses.padding,
        currentSizeClasses.borderRadius,
        'bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900',
        'border-[0.75px] border-neutral-300 dark:border-neutral-700',
        'cursor-not-allowed opacity-70'
      )
    }

    // 默认样式（如果 type 不匹配）
    return cn(
      'inline-flex w-auto',
      currentSizeClasses.padding,
      'mt-5',
      currentSizeClasses.fontSize,
      'font-medium duration-300 ease-out border rounded-full',
      'bg-neutral-900 dark:bg-white',
      'dark:text-neutral-900 text-neutral-100',
      'hover:border-neutral-700 border-neutral-900 dark:hover:border-neutral-300',
      'hover:bg-white dark:hover:bg-black dark:hover:text-white hover:text-neutral-900',
      'max-w-60'
    )
  }

  // 内容样式
  const getContentClasses = () => {
    if (type === 'solid') {
      return cn(
        'flex gap-1 items-center justify-center',
        currentSizeClasses.fontSize,
        'font-medium text-center text-neutral-700 dark:text-neutral-300'
      )
    }

    if (type === 'fill') {
      return cn(
        'flex gap-1 items-center justify-center',
        size === 'md' ? 'text-sm' : currentSizeClasses.fontSize,
        'font-medium text-center text-neutral-50'
      )
    }

    if (type === 'disabled') {
      return cn(
        'flex gap-1 items-center justify-center',
        currentSizeClasses.fontSize,
        'font-medium text-center text-neutral-500 dark:text-neutral-600'
      )
    }

    return currentSizeClasses.fontSize
  }

  const isDisabled = type === 'disabled' || disabled || loading

  // Common props for both button and link
  const commonProps = {
    className: cn(getTypeClasses(), className),
    'aria-disabled': isDisabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  }

  // Content with optional icon
  const renderContent = () => {
    if (loading) {
      return (
        <div className={getContentClasses()}>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </div>
      )
    }

    return (
      <div className={getContentClasses()}>
        {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        {type === 'solid' ? (
          <div>{children}</div>
        ) : type === 'fill' ? (
          <span>{children}</span>
        ) : type === 'disabled' ? (
          <div>{children}</div>
        ) : (
          <span>{children}</span>
        )}
        {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </div>
    )
  }

  // Render as button when no URL is provided
  if (!url) {
    return (
      <button
        {...commonProps}
        type="button"
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        tabIndex={isDisabled ? -1 : 0}
      >
        {renderContent()}
      </button>
    )
  }

  // Render as link when URL is provided
  const href = isDisabled ? '#' : url
  const linkTarget = isDisabled ? undefined : target

  if (isDisabled) {
    return (
      <span {...commonProps} tabIndex={-1} onClick={(e) => e.preventDefault()}>
        {renderContent()}
      </span>
    )
  }

  return (
    <Link href={href} target={linkTarget} {...commonProps} onClick={onClick}>
      {renderContent()}
    </Link>
  )
}
