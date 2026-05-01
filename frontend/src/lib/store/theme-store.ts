/**
 * Color Theme Store
 *
 * Manages the active color theme for the blog.
 * Themes are applied via data-theme attribute on <html>.
 * Persisted to localStorage and synced with next-themes.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  colors: [string, string, string, string, string] // 5 preview swatches
}

export const AVAILABLE_THEMES: ThemeDefinition[] = [
  {
    id: 'midnight-indigo',
    name: '午夜靛蓝',
    description: '默认配色 — 深靛蓝 + 紫色',
    colors: ['#6366f1', '#818cf8', '#a855f7', '#1a1a2e', '#0f0f23'],
  },
  {
    id: 'sunset-orange',
    name: '日落橙',
    description: '温暖活力 — 橙色系',
    colors: ['#f97316', '#fb923c', '#fdba74', '#ffedd5', '#fff7ed'],
  },
  {
    id: 'ocean-teal',
    name: '海洋青',
    description: '冷静清爽 — 青色系',
    colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#ccfbf1', '#f0fdfa'],
  },
  {
    id: 'rose-gold',
    name: '玫瑰金',
    description: '优雅温暖 — 玫瑰色系',
    colors: ['#e11d48', '#f43f5e', '#fb7185', '#ffe4e6', '#fff1f2'],
  },
  {
    id: 'forest-emerald',
    name: '森林翡翠',
    description: '自然沉静 — 绿色系',
    colors: ['#059669', '#10b981', '#34d399', '#d1fae5', '#ecfdf5'],
  },
  {
    id: 'lavender-dream',
    name: '薰衣草梦',
    description: '梦幻创意 — 紫色系',
    colors: ['#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff', '#faf5ff'],
  },
  {
    id: 'github-dark',
    name: 'GitHub 暗色',
    description: '开发者最爱 — GitHub 蓝',
    colors: ['#58a6ff', '#79c0ff', '#1f6feb', '#0d1117', '#161b22'],
  },
  {
    id: 'nord-frost',
    name: 'Nord 冰霜',
    description: '极简北欧 — 冰蓝色系',
    colors: ['#88c0d0', '#81a1c1', '#5e81ac', '#2e3440', '#3b4252'],
  },
  {
    id: 'dracula-purple',
    name: 'Dracula 紫',
    description: '大胆风格 — 经典 Dracula',
    colors: ['#bd93f9', '#ff79c6', '#50fa7b', '#282a36', '#44475a'],
  },
  {
    id: 'amber-warm',
    name: '琥珀暖',
    description: '温暖舒适 — 琥珀色系',
    colors: ['#d97706', '#f59e0b', '#fbbf24', '#fef3c7', '#fffbeb'],
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    description: '黑客美学 — 荧光绿',
    colors: ['#00ff88', '#33ff99', '#00cc66', '#0a0a0a', '#111111'],
  },
]

interface ThemeState {
  /** The active theme ID. '' means default (midnight-indigo) */
  themeId: string
  setTheme: (id: string) => void
  /** Get the current theme definition */
  getTheme: () => ThemeDefinition | undefined
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: '',

      setTheme: (id: string) => {
        // Apply to <html> data-theme attribute
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', id)
        }
        set({ themeId: id })
      },

      getTheme: () => {
        const { themeId } = get()
        return AVAILABLE_THEMES.find((t) => t.id === themeId)
      },
    }),
    {
      name: 'blog-color-theme',
      // Only persist themeId, not the function
      partialize: (state) => ({ themeId: state.themeId }),
    }
  )
)
