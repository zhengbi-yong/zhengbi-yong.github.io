/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-check
/** @type {import("tailwindcss").Config } */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 间距系统 - 整合管理和游客界面
      spacing: {
        // 管理界面专用（紧凑型）
        'admin-xs': '0.25rem',   // 4px
        'admin-sm': '0.5rem',    // 8px
        'admin-md': '0.75rem',   // 12px
        'admin-lg': '1rem',      // 16px
        'admin-xl': '1.25rem',   // 20px
        // 游客界面专用（宽松型）
        'visitor-sm': '2rem',      // 32px
        'visitor-md': '3rem',      // 48px
        'visitor-lg': '5rem',      // 80px
        'visitor-xl': '8rem',      // 128px
      },
      // 管理界面专用字体大小系统
      fontSize: {
        'admin-xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
        'admin-sm': ['0.813rem', { lineHeight: '1.25rem' }], // 13px
        'admin-base': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'admin-lg': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        // 游客界面专用字体大小系统（更大更易读）
        'visitor-base': ['1.125rem', { lineHeight: '1.8' }],  // 18px
        'visitor-lg': ['1.25rem', { lineHeight: '1.75' }],    // 20px
        'visitor-xl': ['1.5rem', { lineHeight: '1.6' }],      // 24px
      },
      // 游客界面专用字体家族
      fontFamily: {
        'visitor-serif': ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        'visitor-sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'visitor-mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      // 游客界面专用缓动函数
      transitionTimingFunction: {
        'visitor': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'visitor-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'visitor-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      // 游客界面专用阴影
      boxShadow: {
        'visitor-soft': '0 20px 40px rgba(26, 26, 46, 0.08)',
        'visitor-medium': '0 25px 50px rgba(26, 26, 46, 0.12)',
        'visitor-strong': '0 30px 60px rgba(26, 26, 46, 0.16)',
        'visitor-glow': '0 0 40px rgba(99, 102, 241, 0.15)',
        'visitor-glow-strong': '0 0 60px rgba(99, 102, 241, 0.25)',
      },
      // 游客界面专用圆角
      borderRadius: {
        'visitor-sm': '0.75rem',
        'visitor-md': '1rem',
        'visitor-lg': '1.5rem',
        'visitor-xl': '2rem',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('--color-primary-500'),
              '&:hover': {
                color: theme('--color-primary-600'),
              },
              code: { color: theme('--color-primary-400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('--tracking-tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('--color-indigo-500'),
              wordBreak: 'normal',
              overflowWrap: 'normal',
            },
            pre: {
              overflowX: 'auto',
              overflowY: 'hidden',
              maxWidth: '100%',
              wordWrap: 'normal',
              whiteSpace: 'pre',
            },
            'pre code': {
              display: 'block',
              overflow: 'visible',
              overflowX: 'visible',
              overflowY: 'visible',
              wordWrap: 'normal',
              whiteSpace: 'pre',
              maxWidth: 'none',
              width: 'max-content',
              minWidth: '100%',
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('--color-pink-500'),
              '&:hover': {
                color: theme('--color-primary-400'),
              },
              code: { color: theme('--color-primary-400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('--color-gray-100'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // @ts-ignore - Tailwind plugin function
    function ({ addVariant }) {
      addVariant('high-contrast', '@media (prefers-contrast: high)')
    },
  ],
}
