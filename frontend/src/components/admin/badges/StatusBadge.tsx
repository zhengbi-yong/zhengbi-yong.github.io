/**
 * 紧凑型状态徽章组件
 *
 * 特性：
 * - 圆点指示器
 * - 颜色编码
 * - 最小化尺寸（12px字体）
 * - 支持多种状态
 */

'use client'

import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  status: 'published' | 'draft' | 'pending' | 'rejected' | 'approved' | 'spam' | 'success' | 'warning' | 'error' | 'info' | string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig: Record<string, { color: string; label: string }> = {
  // 文章状态
  published: { color: 'bg-green-500', label: '已发布' },
  draft: { color: 'bg-yellow-500', label: '草稿' },
  pending: { color: 'bg-blue-500', label: '待审核' },
  rejected: { color: 'bg-red-500', label: '已拒绝' },
  approved: { color: 'bg-green-500', label: '已通过' },
  spam: { color: 'bg-purple-500', label: '垃圾' },

  // 通用状态
  success: { color: 'bg-green-500', label: '成功' },
  warning: { color: 'bg-yellow-500', label: '警告' },
  error: { color: 'bg-red-500', label: '错误' },
  info: { color: 'bg-blue-500', label: '信息' },
}

export function StatusBadge({
  status,
  label: customLabel,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] || { color: 'bg-gray-500', label: status }
  const label = customLabel || config.label

  const sizeStyles = {
    sm: {
      dot: 'w-1 h-1',
      text: 'text-admin-xs',
      padding: 'px-1 py-0.5',
      gap: 'gap-1',
    },
    md: {
      dot: 'w-1.5 h-1.5',
      text: 'text-admin-xs',
      padding: 'px-1.5 py-0.5',
      gap: 'gap-1.5',
    },
    lg: {
      dot: 'w-2 h-2',
      text: 'text-admin-sm',
      padding: 'px-2 py-1',
      gap: 'gap-2',
    },
  }

  const styles = sizeStyles[size]

  return (
    <span
      className={cn(
        'inline-flex items-center',
        styles.padding,
        styles.gap,
        'font-medium',
        'rounded-full',
        // 背景色 - 浅色版本
        status === 'published' || status === 'approved' || status === 'success'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : status === 'draft' || status === 'warning'
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          : status === 'rejected' || status === 'error' || status === 'spam'
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : status === 'pending' || status === 'info'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        className
      )}
    >
      {/* 圆点指示器 */}
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          styles.dot,
          config.color
        )}
      />
      {/* 标签文本 */}
      <span className={cn(styles.text)}>{label}</span>
    </span>
  )
}

/**
 * 极简状态点（仅圆点，无文字）
 */
export interface StatusDotProps {
  status: 'published' | 'draft' | 'pending' | 'rejected' | 'approved' | 'spam' | 'success' | 'warning' | 'error' | 'info' | string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function StatusDot({ status, size = 'md', showLabel = false, className }: StatusDotProps) {
  const config = statusConfig[status] || { color: 'bg-gray-500', label: status }

  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          sizeStyles[size],
          config.color
        )}
      />
      {showLabel && (
        <span className="text-admin-xs text-gray-600 dark:text-gray-400">
          {config.label}
        </span>
      )}
    </div>
  )
}

/**
 * 角色徽章（用户角色显示）
 */
export interface RoleBadgeProps {
  role: 'admin' | 'moderator' | 'user' | string
  className?: string
}

const roleConfig: Record<string, { color: string; label: string; bgColor: string; textColor: string }> = {
  admin: {
    color: 'bg-red-500',
    label: '管理员',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
  },
  moderator: {
    color: 'bg-purple-500',
    label: '版主',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-300',
  },
  user: {
    color: 'bg-gray-500',
    label: '用户',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-800 dark:text-gray-300',
  },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.user

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2 py-0.5',
        'text-admin-xs',
        'font-semibold',
        'rounded-full',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('w-1 h-1 rounded-full', config.color)} />
      {config.label}
    </span>
  )
}

/**
 * 验证状态徽章
 */
export interface VerificationBadgeProps {
  verified: boolean
  className?: string
}

export function VerificationBadge({ verified, className }: VerificationBadgeProps) {
  return (
    <StatusBadge
      status={verified ? 'success' : 'warning'}
      label={verified ? '已验证' : '未验证'}
      size="sm"
      className={className}
    />
  )
}
