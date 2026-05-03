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
  category: 'blue' | 'purple' | 'green' | 'warm' | 'pink' | 'neutral' | 'dark-classic'
  colors: [string, string, string, string, string] // 5 preview swatches
}

export const THEME_CATEGORIES = {
  blue: { label: '蓝色系', icon: '💙' },
  purple: { label: '紫色系', icon: '💜' },
  green: { label: '绿色系', icon: '💚' },
  warm: { label: '暖色系', icon: '🧡' },
  pink: { label: '粉色系', icon: '💗' },
  neutral: { label: '中性系', icon: '🩶' },
  'dark-classic': { label: '经典暗色', icon: '🖤' },
} as const

export const AVAILABLE_THEMES: ThemeDefinition[] = [
<<<<<<< HEAD
  {
    id: 'midnight-indigo',
    name: '午夜靛蓝',
    description: '默认 — 深靛蓝+紫色',
    colors: ['#818cf8', '#a5b4fc', '#6366f1', '#1a1a3e', '#0f0f23'],
  },
  {
    id: 'sunset-orange',
    name: '日落橙',
    description: '温暖活力 — 橙色系',
    colors: ['#fb923c', '#fdba74', '#f97316', '#2c2016', '#1c130c'],
  },
  {
    id: 'ocean-teal',
    name: '海洋青',
    description: '冷静清爽 — 青色系',
    colors: ['#2dd4bf', '#5eead4', '#0d9488', '#192826', '#0f1918'],
  },
  {
    id: 'rose-gold',
    name: '玫瑰金',
    description: '优雅温暖 — 玫瑰色系',
    colors: ['#fb7185', '#fda4af', '#e11d48', '#2c1619', '#1c0c0e'],
  },
  {
    id: 'forest-emerald',
    name: '森林翡翠',
    description: '自然沉静 — 绿色系',
    colors: ['#34d399', '#6ee7b7', '#059669', '#192823', '#0f1915'],
  },
  {
    id: 'lavender-dream',
    name: '薰衣草梦',
    description: '梦幻创意 — 紫色系',
    colors: ['#c084fc', '#d8b4fe', '#a855f7', '#21162c', '#140c1c'],
  },
  {
    id: 'github-dark',
    name: 'GitHub 暗色',
    description: '开发者最爱 — GitHub蓝',
    colors: ['#58a6ff', '#79c0ff', '#58a6ff', '#15202c', '#0c131c'],
  },
  {
    id: 'nord-frost',
    name: 'Nord 冰霜',
    description: '极简北欧 — 冰蓝色系',
    colors: ['#88c0d0', '#81a1c1', '#88c0d0', '#1c2326', '#101618'],
  },
  {
    id: 'dracula-purple',
    name: 'Dracula 紫',
    description: '大胆风格 — 经典Dracula',
    colors: ['#bd93f9', '#ff79c6', '#bd93f9', '#1f162b', '#130d1b'],
  },
  {
    id: 'amber-warm',
    name: '琥珀暖',
    description: '温暖舒适 — 琥珀色系',
    colors: ['#fbbf24', '#fcd34d', '#d97706', '#2c2615', '#1c170c'],
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    description: '黑客美学 — 荧光绿',
    colors: ['#00ff88', '#33ff99', '#00ff88', '#152c21', '#0c1c14'],
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: '温暖粉紫 — 暗底柔和',
    colors: ['#cba6f7', '#f5c2e7', '#cba6f7', '#20172a', '#130d1b'],
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    description: '柔和淡紫 — 亮底奶油',
    colors: ['#8839ef', '#ea76cb', '#8839ef', '#1f172b', '#130d1b'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: '霓虹蓝 — 都市暗',
    colors: ['#7aa2f7', '#9ece6a', '#7aa2f7', '#161d2b', '#0d111b'],
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: '复古暖黄 — 暗底',
    colors: ['#fabd2f', '#fe8019', '#fabd2f', '#2c2516', '#1c170c'],
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    description: '琥珀暖 — 纸色底',
    colors: ['#b57614', '#af3a03', '#b57614', '#2a2317', '#1a150d'],
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: '科学蓝 — 暗绿底',
    colors: ['#268bd2', '#2aa198', '#268bd2', '#192229', '#0e151a'],
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: '精确蓝 — 纸色底',
    colors: ['#268bd2', '#2aa198', '#268bd2', '#192229', '#0e151a'],
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    description: '粉红 — 暗炭底',
    colors: ['#ff6188', '#fc9867', '#ff6188', '#2c151b', '#1c0c10'],
  },
  {
    id: 'nord-aurora',
    name: 'Nord Aurora',
    description: '紫 — 北极光',
    colors: ['#b48ead', '#88c0d0', '#b48ead', '#261c24', '#181016'],
  },
  {
    id: 'everforest',
    name: 'Everforest',
    description: '苔绿 — 森林系',
    colors: ['#a7c080', '#7fbbb3', '#a7c080', '#22261c', '#151810'],
  },
  {
    id: 'apple-slate',
    name: 'Apple Slate',
    description: '苹果蓝 — 极简白',
    colors: ['#2997ff', '#40a9ff', '#0071e3', '#15212c', '#0c141c'],
  },
  {
    id: 'stripe-blue',
    name: 'Stripe Blue',
    description: '电子靛蓝 — 科技白',
    colors: ['#7a73ff', '#8f89ff', '#635bff', '#16152c', '#0d0c1c'],
  },
  {
    id: 'spotify-green',
    name: 'Spotify Green',
    description: '经典绿 — 暗黑底',
    colors: ['#1ed760', '#1fdf64', '#1ed760', '#18291e', '#0e1a12'],
  },
  {
    id: 'discord-blurple',
    name: 'Discord Blurple',
    description: '蓝紫 — 社区风',
    colors: ['#5865f2', '#7983f5', '#5865f2', '#17182b', '#0d0e1b'],
  },
  {
    id: 'notion-light',
    name: 'Notion Light',
    description: '文字即点缀 — 极简',
    colors: ['#37352f', '#9b9a97', '#37352f', '#26231c', '#181610'],
  },
  {
    id: 'linear-dark',
    name: 'Linear Dark',
    description: '紫 — 精英黑',
    colors: ['#5e6ad2', '#6b75d6', '#5e6ad2', '#1a1b27', '#0f1018'],
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: '粉白 — 春樱',
    colors: ['#f472b6', '#fb7185', '#f472b6', '#2b1721', '#1b0d14'],
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    description: '抹茶绿 — 清新',
    colors: ['#84cc16', '#a3e635', '#65a30d', '#232a17', '#151a0d'],
  },
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    description: '深蓝霓虹 — 深海',
    colors: ['#06b6d4', '#22d3ee', '#06b6d4', '#16282c', '#0c191c'],
  },
  {
    id: 'terracotta-earth',
    name: 'Terracotta Earth',
    description: '赤陶 — 大地色',
    colors: ['#ea580c', '#f97316', '#c2410c', '#2b1d16', '#1b120d'],
  },
  {
    id: 'plum-noir',
    name: 'Plum Noir',
    description: '深紫 — 暗黑优雅',
    colors: ['#a855f7', '#c084fc', '#7e22ce', '#21162b', '#140c1b'],
  },
=======
  { id: 'midnight-indigo', name: '午夜靛蓝', description: '默认 — 深靛蓝+紫色', category: 'purple', colors: ['#818cf8', '#a5b4fc', '#6366f1', '#1a1a3e', '#0f0f23'] },
  { id: 'sunset-orange', name: '日落橙', description: '温暖活力 — 橙色系', category: 'warm', colors: ['#fb923c', '#fdba74', '#f97316', '#2c2016', '#1c130c'] },
  { id: 'ocean-teal', name: '海洋青', description: '冷静清爽 — 青色系', category: 'green', colors: ['#2dd4bf', '#5eead4', '#0d9488', '#192826', '#0f1918'] },
  { id: 'rose-gold', name: '玫瑰金', description: '优雅温暖 — 玫瑰色系', category: 'pink', colors: ['#fb7185', '#fda4af', '#e11d48', '#2c1619', '#1c0c0e'] },
  { id: 'forest-emerald', name: '森林翡翠', description: '自然沉静 — 绿色系', category: 'green', colors: ['#34d399', '#6ee7b7', '#059669', '#192823', '#0f1915'] },
  { id: 'lavender-dream', name: '薰衣草梦', description: '梦幻创意 — 紫色系', category: 'purple', colors: ['#c084fc', '#d8b4fe', '#a855f7', '#21162c', '#140c1c'] },
  { id: 'github-dark', name: 'GitHub 暗色', description: '开发者最爱 — GitHub蓝', category: 'blue', colors: ['#58a6ff', '#79c0ff', '#58a6ff', '#15202c', '#0c131c'] },
  { id: 'nord-frost', name: 'Nord 冰霜', description: '极简北欧 — 冰蓝色系', category: 'blue', colors: ['#88c0d0', '#81a1c1', '#88c0d0', '#1c2326', '#101618'] },
  { id: 'dracula-purple', name: 'Dracula 紫', description: '大胆风格 — 经典Dracula', category: 'dark-classic', colors: ['#bd93f9', '#ff79c6', '#bd93f9', '#1f162b', '#130d1b'] },
  { id: 'amber-warm', name: '琥珀暖', description: '温暖舒适 — 琥珀色系', category: 'warm', colors: ['#fbbf24', '#fcd34d', '#d97706', '#2c2615', '#1c170c'] },
  { id: 'cyber-neon', name: '赛博霓虹', description: '黑客美学 — 荧光绿', category: 'green', colors: ['#00ff88', '#33ff99', '#00ff88', '#152c21', '#0c1c14'] },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', description: '温暖粉紫 — 暗底柔和', category: 'dark-classic', colors: ['#cba6f7', '#f5c2e7', '#cba6f7', '#20172a', '#130d1b'] },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', description: '柔和淡紫 — 亮底奶油', category: 'pink', colors: ['#8839ef', '#ea76cb', '#8839ef', '#1f172b', '#130d1b'] },
  { id: 'tokyo-night', name: 'Tokyo Night', description: '霓虹蓝 — 都市暗', category: 'dark-classic', colors: ['#7aa2f7', '#9ece6a', '#7aa2f7', '#161d2b', '#0d111b'] },
  { id: 'gruvbox-dark', name: 'Gruvbox Dark', description: '复古暖黄 — 暗底', category: 'dark-classic', colors: ['#fabd2f', '#fe8019', '#fabd2f', '#2c2516', '#1c170c'] },
  { id: 'gruvbox-light', name: 'Gruvbox Light', description: '琥珀暖 — 纸色底', category: 'warm', colors: ['#b57614', '#af3a03', '#b57614', '#2a2317', '#1a150d'] },
  { id: 'solarized-dark', name: 'Solarized Dark', description: '科学蓝 — 暗绿底', category: 'dark-classic', colors: ['#268bd2', '#2aa198', '#268bd2', '#192229', '#0e151a'] },
  { id: 'solarized-light', name: 'Solarized Light', description: '精确蓝 — 纸色底', category: 'blue', colors: ['#268bd2', '#2aa198', '#268bd2', '#192229', '#0e151a'] },
  { id: 'monokai-pro', name: 'Monokai Pro', description: '粉红 — 暗炭底', category: 'dark-classic', colors: ['#ff6188', '#fc9867', '#ff6188', '#2c151b', '#1c0c10'] },
  { id: 'nord-aurora', name: 'Nord Aurora', description: '紫 — 北极光', category: 'purple', colors: ['#b48ead', '#88c0d0', '#b48ead', '#261c24', '#181016'] },
  { id: 'everforest', name: 'Everforest', description: '苔绿 — 森林系', category: 'dark-classic', colors: ['#a7c080', '#7fbbb3', '#a7c080', '#22261c', '#151810'] },
  { id: 'apple-slate', name: 'Apple Slate', description: '苹果蓝 — 极简白', category: 'blue', colors: ['#2997ff', '#40a9ff', '#0071e3', '#15212c', '#0c141c'] },
  { id: 'stripe-blue', name: 'Stripe Blue', description: '电子靛蓝 — 科技白', category: 'blue', colors: ['#7a73ff', '#8f89ff', '#635bff', '#16152c', '#0d0c1c'] },
  { id: 'spotify-green', name: 'Spotify Green', description: '经典绿 — 暗黑底', category: 'dark-classic', colors: ['#1ed760', '#1fdf64', '#1ed760', '#18291e', '#0e1a12'] },
  { id: 'discord-blurple', name: 'Discord Blurple', description: '蓝紫 — 社区风', category: 'dark-classic', colors: ['#5865f2', '#7983f5', '#5865f2', '#17182b', '#0d0e1b'] },
  { id: 'notion-light', name: 'Notion Light', description: '文字即点缀 — 极简', category: 'neutral', colors: ['#37352f', '#9b9a97', '#37352f', '#26231c', '#181610'] },
  { id: 'linear-dark', name: 'Linear Dark', description: '紫 — 精英黑', category: 'dark-classic', colors: ['#5e6ad2', '#6b75d6', '#5e6ad2', '#1a1b27', '#0f1018'] },
  { id: 'cherry-blossom', name: 'Cherry Blossom', description: '粉白 — 春樱', category: 'pink', colors: ['#f472b6', '#fb7185', '#f472b6', '#2b1721', '#1b0d14'] },
  { id: 'matcha-latte', name: 'Matcha Latte', description: '抹茶绿 — 清新', category: 'green', colors: ['#84cc16', '#a3e635', '#65a30d', '#232a17', '#151a0d'] },
  { id: 'midnight-aurora', name: 'Midnight Aurora', description: '深蓝霓虹 — 深海', category: 'blue', colors: ['#06b6d4', '#22d3ee', '#06b6d4', '#16282c', '#0c191c'] },
  { id: 'terracotta-earth', name: 'Terracotta Earth', description: '赤陶 — 大地色', category: 'warm', colors: ['#ea580c', '#f97316', '#c2410c', '#2b1d16', '#1b120d'] },
  { id: 'plum-noir', name: 'Plum Noir', description: '深紫 — 暗黑优雅', category: 'dark-classic', colors: ['#a855f7', '#c084fc', '#7e22ce', '#21162b', '#140c1b'] },
>>>>>>> feature/user-profiles
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
