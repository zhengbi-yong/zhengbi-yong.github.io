// @ts-nocheck
import { create } from 'zustand'
import { createBaseInitialState } from '../core/types'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState {
  toasts: Toast[]
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
}

type ToastStore = ToastState & ToastActions

/**
 * Toast Store
 * 管理全局 Toast 通知
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  // Initial state
  toasts: [],

  // Add toast
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id)
    }, newToast.duration)

    return id
  },

  // Remove toast
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  // Clear all toasts
  clearAll: () => {
    set({ toasts: [] })
  },

  // Convenience methods
  success: (title, description) => {
    return get().addToast({ title, description, variant: 'success' })
  },

  error: (title, description) => {
    return get().addToast({ title, description, variant: 'error', duration: 7000 })
  },

  warning: (title, description) => {
    return get().addToast({ title, description, variant: 'warning', duration: 6000 })
  },

  info: (title, description) => {
    return get().addToast({ title, description, variant: 'info' })
  },
}))

/**
 * Toast Hook
 * 提供便捷的 Toast 操作方法
 */
export function useToast() {
  const toast = useToastStore()

  return {
    ...toast,
    // 带操作的成功 Toast
    successWithAction: (
      title: string,
      action: { label: string; onClick: () => void }
    ) => {
      return toast.addToast({ title, variant: 'success', action })
    },
    // 带操作的错误 Toast
    errorWithAction: (
      title: string,
      action: { label: string; onClick: () => void }
    ) => {
      return toast.addToast({ title, variant: 'error', action })
    },
  }
}
