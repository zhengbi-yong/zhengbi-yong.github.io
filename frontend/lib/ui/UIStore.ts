import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

interface UIState {
  // 全局加载状态
  globalLoading: LoadingState
  setGlobalLoading: (loading: Partial<LoadingState>) => void

  // 组件级别的加载状态
  componentLoading: Record<string, LoadingState>
  setComponentLoading: (id: string, loading: Partial<LoadingState>) => void
  clearComponentLoading: (id: string) => void

  // 通知系统
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message?: string
    duration?: number
    timestamp: number
  }>
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // 模态框状态
  modals: Record<string, boolean>
  openModal: (id: string) => void
  closeModal: (id: string) => void
  closeAllModals: () => void

  // 侧边栏状态
  sidebar: {
    left: boolean
    right: boolean
  }
  toggleSidebar: (side: 'left' | 'right') => void
  setSidebar: (side: 'left' | 'right', open: boolean) => void

  // 主题模式
  colorMode: 'light' | 'dark' | 'system'
  setColorMode: (mode: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // 全局加载状态
      globalLoading: {
        isLoading: false,
      },
      setGlobalLoading: (loading) =>
        set((state) => ({
          globalLoading: { ...state.globalLoading, ...loading },
        })),

      // 组件加载状态
      componentLoading: {},
      setComponentLoading: (id, loading) =>
        set((state) => ({
          componentLoading: {
            ...state.componentLoading,
            [id]: { ...state.componentLoading[id], ...loading },
          },
        })),
      clearComponentLoading: (id) =>
        set((state) => {
          const newLoading = { ...state.componentLoading }
          delete newLoading[id]
          return { componentLoading: newLoading }
        }),

      // 通知系统
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
            },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // 模态框状态
      modals: {},
      openModal: (id) =>
        set((state) => ({
          modals: { ...state.modals, [id]: true },
        })),
      closeModal: (id) =>
        set((state) => ({
          modals: { ...state.modals, [id]: false },
        })),
      closeAllModals: () => set({ modals: {} }),

      // 侧边栏状态
      sidebar: {
        left: false,
        right: false,
      },
      toggleSidebar: (side) =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            [side]: !state.sidebar[side],
          },
        })),
      setSidebar: (side, open) =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            [side]: open,
          },
        })),

      // 主题模式
      colorMode: 'system',
      setColorMode: (mode) => set({ colorMode: mode }),
    }),
    {
      name: 'ui-store',
    }
  )
)

// 便捷 hooks
export const useGlobalLoading = () => {
  const { globalLoading, setGlobalLoading } = useUIStore()
  return {
    ...globalLoading,
    setLoading: (loading: Partial<LoadingState>) => setGlobalLoading(loading),
    showLoading: (message?: string) => setGlobalLoading({ isLoading: true, message }),
    hideLoading: () =>
      setGlobalLoading({ isLoading: false, message: undefined, progress: undefined }),
  }
}

export const useComponentLoading = (id: string) => {
  const { componentLoading, setComponentLoading, clearComponentLoading } = useUIStore()
  const loading = componentLoading[id] || { isLoading: false }

  return {
    ...loading,
    setLoading: (loading: Partial<LoadingState>) => setComponentLoading(id, loading),
    showLoading: (message?: string) => setComponentLoading(id, { isLoading: true, message }),
    hideLoading: () => clearComponentLoading(id),
  }
}

export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore()

  return {
    notifications,
    notify: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) =>
      addNotification(notification),
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addNotification({ type: 'info', title, message }),
    remove: removeNotification,
    clear: clearNotifications,
  }
}

export const useModals = () => {
  const { modals, openModal, closeModal, closeAllModals } = useUIStore()

  return {
    modals,
    isOpen: (id: string) => !!modals[id],
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
  }
}

export const useSidebar = () => {
  const { sidebar, toggleSidebar, setSidebar } = useUIStore()

  return {
    ...sidebar,
    toggle: toggleSidebar,
    set: setSidebar,
    openLeft: () => setSidebar('left', true),
    openRight: () => setSidebar('right', true),
    closeLeft: () => setSidebar('left', false),
    closeRight: () => setSidebar('right', false),
  }
}

export const useColorMode = () => {
  const { colorMode, setColorMode } = useUIStore()

  return {
    colorMode,
    setMode: setColorMode,
    isLight: colorMode === 'light',
    isDark: colorMode === 'dark',
    isSystem: colorMode === 'system',
  }
}
