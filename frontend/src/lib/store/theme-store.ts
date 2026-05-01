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
    description: '默认 — 深靛蓝+紫色',
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
    description: '开发者最爱 — GitHub蓝',
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
    description: '大胆风格 — 经典Dracula',
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
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: '温暖粉紫 — 暗底柔和',
    colors: ['#cba6f7', '#f5c2e7', '#89b4fa', '#1e1e2e', '#313244'],
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    description: '柔和淡紫 — 亮底奶油',
    colors: ['#8839ef', '#ea76cb', '#04a5e5', '#eff1f5', '#e6e9ef'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: '霓虹蓝 — 都市暗',
    colors: ['#7aa2f7', '#9ece6a', '#f7768e', '#1a1b26', '#24283b'],
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: '复古暖黄 — 暗底',
    colors: ['#fabd2f', '#fe8019', '#83a598', '#282828', '#3c3836'],
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    description: '琥珀暖 — 纸色底',
    colors: ['#b57614', '#af3a03', '#076678', '#fbf1c7', '#ebdbb2'],
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: '科学蓝 — 暗绿底',
    colors: ['#268bd2', '#2aa198', '#b58900', '#002b36', '#073642'],
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: '精确蓝 — 纸色底',
    colors: ['#268bd2', '#2aa198', '#b58900', '#fdf6e3', '#eee8d5'],
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    description: '粉红 — 暗炭底',
    colors: ['#ff6188', '#fc9867', '#a9dc76', '#2d2a2e', '#403e41'],
  },
  {
    id: 'nord-aurora',
    name: 'Nord Aurora',
    description: '紫 — 北极光',
    colors: ['#b48ead', '#88c0d0', '#81a1c1', '#2e3440', '#3b4252'],
  },
  {
    id: 'everforest',
    name: 'Everforest',
    description: '苔绿 — 森林系',
    colors: ['#a7c080', '#7fbbb3', '#e69875', '#2b3339', '#323c41'],
  },
  {
    id: 'apple-slate',
    name: 'Apple Slate',
    description: '苹果蓝 — 极简白',
    colors: ['#0071e3', '#2997ff', '#86868b', '#ffffff', '#f5f5f7'],
  },
  {
    id: 'stripe-blue',
    name: 'Stripe Blue',
    description: '电子靛蓝 — 科技白',
    colors: ['#635bff', '#7a73ff', '#0a2540', '#ffffff', '#f6f9fc'],
  },
  {
    id: 'spotify-green',
    name: 'Spotify Green',
    description: '经典绿 — 暗黑底',
    colors: ['#1ed760', '#1fdf64', '#b3b3b3', '#121212', '#282828'],
  },
  {
    id: 'discord-blurple',
    name: 'Discord Blurple',
    description: '蓝紫 — 社区风',
    colors: ['#5865f2', '#4752c4', '#eb459e', '#ffffff', '#f2f3f5'],
  },
  {
    id: 'notion-light',
    name: 'Notion Light',
    description: '文字即点缀 — 极简',
    colors: ['#37352f', '#9b9a97', '#e16259', '#ffffff', '#fbfbfa'],
  },
  {
    id: 'linear-dark',
    name: 'Linear Dark',
    description: '紫 — 精英黑',
    colors: ['#5e6ad2', '#6b75d6', '#828282', '#0d0d0d', '#1a1a1a'],
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: '粉白 — 春樱',
    colors: ['#f472b6', '#fb7185', '#fda4af', '#fff1f2', '#ffe4e6'],
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    description: '抹茶绿 — 清新',
    colors: ['#65a30d', '#84cc16', '#a3e635', '#f7fee7', '#ecfccb'],
  },
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    description: '深蓝霓虹 — 深海',
    colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#020617', '#0f172a'],
  },
  {
    id: 'terracotta-earth',
    name: 'Terracotta Earth',
    description: '赤陶 — 大地色',
    colors: ['#c2410c', '#ea580c', '#f97316', '#fef2f2', '#fee2e2'],
  },
  {
    id: 'plum-noir',
    name: 'Plum Noir',
    description: '深紫 — 暗黑优雅',
    colors: ['#7e22ce', '#a855f7', '#c084fc', '#0f0f1a', '#1a1a2e'],
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
