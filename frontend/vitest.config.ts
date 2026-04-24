import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
      exclude: [
        'node_modules/',
        'tests/',
        'src/mocks/',
        '**/*.config.*',
        '**/*.d.ts',
        '.contentlayer/',
        'public/',
        'out/',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: [
      // Longest-prefix-first — Vite uses first-match-wins
      { find: '@/src/app/admin/comments', replacement: resolve(__dirname, './src/app/(admin)/admin/comments') },
      { find: '@/src/app/admin/users-refine', replacement: resolve(__dirname, './src/app/(admin)/admin/users-refine') },
      { find: '@/src/app/admin', replacement: resolve(__dirname, './src/app/(admin)/admin') },
      { find: '@/src/app', replacement: resolve(__dirname, './src/app') },
      { find: '@/src', replacement: resolve(__dirname, './src') },
      { find: '@/components', replacement: resolve(__dirname, './src/components') },
      { find: '@/lib', replacement: resolve(__dirname, './src/lib') },
      { find: '@/lib/store', replacement: resolve(__dirname, './src/lib/store') },
      { find: '@/lib/providers', replacement: resolve(__dirname, './src/lib/providers') },
      { find: '@/lib/security', replacement: resolve(__dirname, './src/lib/security') },
      { find: '@/lib/hooks', replacement: resolve(__dirname, './src/lib/hooks') },
      { find: '@/lib/types', replacement: resolve(__dirname, './src/lib/types') },
      { find: '@/layouts', replacement: resolve(__dirname, './src/layouts') },
      { find: '@/mocks', replacement: resolve(__dirname, './src/mocks') },
      { find: '@/data', replacement: resolve(__dirname, './data') },
      // Note: @/lib/utils/cleanup → @/lib → ./src/lib + /utils/cleanup = ./src/lib/utils/cleanup.ts
    ],
  },
})
