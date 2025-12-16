import type { StorybookConfig } from '@storybook/nextjs-vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../layouts/**/*.stories.@(js|jsx|ts|tsx)',
    '../lib/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-links'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../'),
      'three/examples/jsm': path.resolve(__dirname, '../node_modules/three/examples/jsm'),
    }
    // 确保 node_modules 解析正确，支持 package.json exports 字段
    config.resolve.conditions = config.resolve.conditions || []
    if (!config.resolve.conditions.includes('import')) {
      config.resolve.conditions.push('import')
    }
    if (!config.resolve.conditions.includes('module')) {
      config.resolve.conditions.push('module')
    }
    if (!config.resolve.conditions.includes('browser')) {
      config.resolve.conditions.push('browser')
    }
    // 确保 preserveSymlinks 为 false，以便正确解析符号链接
    config.resolve.preserveSymlinks = false
    // 优化依赖，确保 pliny 被正确处理
    config.optimizeDeps = config.optimizeDeps || {}
    config.optimizeDeps.include = config.optimizeDeps.include || []
    if (!config.optimizeDeps.include.includes('pliny')) {
      config.optimizeDeps.include.push('pliny')
    }
    // 确保 JSX 正确解析
    if (config.esbuild) {
      config.esbuild.jsx = 'automatic'
    }
    return config
  },
}

export default config
