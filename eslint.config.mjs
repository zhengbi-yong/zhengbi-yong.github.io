import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// 使用 fixupConfigRules 修复 FlatCompat 返回的配置，解决循环引用问题
// 分别处理配置以避免循环引用
const typescriptConfigs = fixupConfigRules(
  compat.extends(
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  )
)

const jsxA11yConfigs = fixupConfigRules(
  compat.extends('plugin:jsx-a11y/recommended')
)

const prettierConfigs = fixupConfigRules(
  compat.extends('plugin:prettier/recommended')
)

// Next.js 配置可能导致循环引用，尝试单独处理
let nextConfigs = []
try {
  nextConfigs = fixupConfigRules(compat.extends('next', 'next/core-web-vitals'))
} catch (error) {
  // 如果 Next.js 配置有问题，尝试只使用 next
  try {
    nextConfigs = fixupConfigRules(compat.extends('next'))
  } catch (e) {
    console.warn('Warning: Could not load Next.js ESLint config:', e.message)
  }
}

export default [
  {
    ignores: ['next.config.js'], // Next.js 配置文件使用 CommonJS，忽略 ESLint 检查
  },
  js.configs.recommended,
  ...typescriptConfigs,
  ...jsxA11yConfigs,
  ...prettierConfigs,
  ...nextConfigs,
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.amd,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',

      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['hrefLeft', 'hrefRight'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
]
