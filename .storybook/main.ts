import type { StorybookConfig } from '@storybook/nextjs-vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)', '../**/*.stories.@(js|jsx|ts|tsx|mdx)', '../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    // @storybook/addon-essentials and @storybook/addon-interactions are not available for Storybook 10
    // They may be built into Storybook 10 core or available through other means
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Add path aliases
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
      '@/components': './components',
      '@/lib': './lib',
      '@/data': './data',
      '@/layouts': './layouts',
      '@/app': './app',
      // Mock next/navigation for Storybook
      'next/navigation': path.resolve(__dirname, './mock-next-navigation.ts'),
    }
    return config
  },
}

export default config