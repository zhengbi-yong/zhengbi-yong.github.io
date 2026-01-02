'use client'

import { memo } from 'react'
import { Toast } from '@/lib/store/toast-store'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastVariants = {
  success: {
    container: 'border-l-4 border-green-500 bg-white dark:bg-gray-800',
    icon: 'text-green-500',
    title: 'text-gray-900 dark:text-gray-100',
  },
  error: {
    container: 'border-l-4 border-red-500 bg-white dark:bg-gray-800',
    icon: 'text-red-500',
    title: 'text-gray-900 dark:text-gray-100',
  },
  warning: {
    container: 'border-l-4 border-yellow-500 bg-white dark:bg-gray-800',
    icon: 'text-yellow-500',
    title: 'text-gray-900 dark:text-gray-100',
  },
  info: {
    container: 'border-l-4 border-blue-500 bg-white dark:bg-gray-800',
    icon: 'text-blue-500',
    title: 'text-gray-900 dark:text-gray-100',
  },
}

const ToastComponent = memo(function ToastComponent({ toast, onRemove }: ToastProps) {
  const variant = toastVariants[toast.variant]
  const Icon = toastIcons[toast.variant]

  return (
    <div
      className={`
        relative flex w-full items-start gap-3 rounded-lg
        p-4 shadow-lg transition-all duration-300 ease-in-out
        ${variant.container}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${variant.icon}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h4 className={`text-sm font-medium ${variant.title}`}>
          {toast.title}
        </h4>

        {toast.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}

        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="
          flex-shrink-0 rounded-md p-1
          text-gray-400 hover:text-gray-500 hover:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-700
          transition-colors duration-150
        "
        aria-label="关闭通知"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
})

export default ToastComponent
