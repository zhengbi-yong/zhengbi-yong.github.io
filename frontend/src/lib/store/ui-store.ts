import { create } from './create-store'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

/**
 * UI 相关状态管理
 * 管理侧边栏等 UI 状态
 *
 * 注意: 主题状态统一由 next-themes 管理(ThemeProvider in app/theme-providers.tsx),
 * 不在此 store 中维护,避免双源冲突.
 */
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
