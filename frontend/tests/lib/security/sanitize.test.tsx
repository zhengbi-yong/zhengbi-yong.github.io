import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeUserInput,
  sanitizeClassNames,
  sanitizeProps,
} from '@/lib/security/sanitize'

describe('Security: Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("xss")</script><p>Safe content</p>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('<p>Safe content</p>')
    })

    it('should remove dangerous attributes', () => {
      const dirty = '<div onclick="alert(1)" onmouseover="alert(2)">Content</div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onclick')
      expect(clean).not.toContain('onmouseover')
    })

    it('should allow safe HTML tags', () => {
      const safe = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p>'
      const clean = sanitizeHtml(safe)
      expect(clean).toBe(safe)
    })

    it('should handle MDX specific tags', () => {
      const mdx = '<math><mn>1</mn><mo>+</mo><mn>2</mn></math>'
      const clean = sanitizeHtml(mdx, { isMdx: true })
      expect(clean).toContain('<math>')
    })

    it('should remove javascript: URLs', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('javascript:')
    })
  })

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const dirty = 'Text\x00with\x1Fcontrol\x7Fcharacters'
      const clean = sanitizeText(dirty)
      expect(clean).toBe('Textwithcontrolcharacters')
    })

    it('should remove zero-width characters', () => {
      const dirty = 'Text\uFEFFwith\u200Bzero\u200Bwidth'
      const clean = sanitizeText(dirty)
      expect(clean).toBe('Textwithzerowidth')
    })

    it('should trim whitespace', () => {
      const dirty = '  padded text  '
      const clean = sanitizeText(dirty)
      expect(clean).toBe('padded text')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow safe protocols', () => {
      const safeUrls = [
        'https://example.com',
        'http://example.com',
        'mailto:test@example.com',
        'tel:+1234567890',
      ]

      safeUrls.forEach((url) => {
        expect(sanitizeUrl(url)).toBe(url)
      })
    })

    it('should block dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
      ]

      dangerousUrls.forEach((url) => {
        expect(sanitizeUrl(url)).toBe('#')
      })
    })

    it('should respect domain whitelist', () => {
      const allowedDomains = ['example.com', 'trusted.com']

      expect(sanitizeUrl('https://example.com/path', allowedDomains)).toBe(
        'https://example.com/path'
      )

      expect(sanitizeUrl('https://evil.com/path', allowedDomains)).toBe('#')
    })
  })

  describe('sanitizeUserInput', () => {
    it('should remove HTML-like content', () => {
      const input = 'Hello <script>alert(1)</script> world'
      const clean = sanitizeUserInput(input)
      expect(clean).not.toContain('<script>')
      expect(clean).toBe('Hello alert(1) world')
    })

    it('should respect max length', () => {
      const input = 'a'.repeat(100)
      const clean = sanitizeUserInput(input, 50)
      expect(clean.length).toBe(50)
    })
  })

  describe('sanitizeClassNames', () => {
    it('should allow valid class names', () => {
      const valid = 'class1 class-2 class_3'
      const clean = sanitizeClassNames(valid)
      expect(clean).toBe(valid)
    })

    it('should remove invalid characters', () => {
      const invalid = 'class1 class@2 class#3'
      const clean = sanitizeClassNames(invalid)
      expect(clean).toBe('class1 class2 class3')
    })
  })

  describe('sanitizeProps', () => {
    it('should remove function props', () => {
      const props = {
        onClick: () => {},
        className: 'safe-class',
        'data-testid': 'test',
      }

      const clean = sanitizeProps(props)
      expect(clean.onClick).toBeUndefined()
      expect(clean.className).toBe('safe-class')
      expect(clean['data-testid']).toBe('test')
    })

    it('should remove event handlers', () => {
      const props = {
        onMouseOver: () => {},
        onSubmit: () => {},
        normalProp: 'value',
      }

      const clean = sanitizeProps(props)
      expect(clean.onMouseOver).toBeUndefined()
      expect(clean.onSubmit).toBeUndefined()
      expect(clean.normalProp).toBe('value')
    })

    it('should sanitize string values', () => {
      const props = {
        title: '<script>alert(1)</script>',
        count: 42,
      }

      const clean = sanitizeProps(props)
      expect(clean.title).not.toContain('<script>')
      expect(clean.count).toBe(42)
    })

    it('should respect allowed attributes list', () => {
      const props = {
        className: 'class',
        id: 'id',
        title: 'title',
        custom: 'value',
      }

      const clean = sanitizeProps(props, ['className', 'id'])
      expect(clean.className).toBe('class')
      expect(clean.id).toBe('id')
      expect(clean.title).toBeUndefined()
      expect(clean.custom).toBeUndefined()
    })
  })
})
