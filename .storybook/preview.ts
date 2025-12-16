import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import '../css/tailwind.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    nextjs: {
      appDirectory: true,
    },
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#1f2937',
        },
      },
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'zh-CN', title: '中文' },
        ],
      },
    },
  },

  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { className: 'min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' },
        React.createElement(Story)
      ),
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
  },
}

export default preview
