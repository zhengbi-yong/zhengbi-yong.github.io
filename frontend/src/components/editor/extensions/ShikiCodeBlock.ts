'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ShikiCodeBlockComponent } from './ShikiCodeBlockComponent'

// ------------------------------------------------------------------------------------------------
// ShikiCodeBlock — replaces StarterKit's plain codeBlock with Shiki-powered highlighting.
// Uses a custom React NodeView; the lowlight import is only for language detection metadata.
// ------------------------------------------------------------------------------------------------
export const ShikiCodeBlock = Node.create({
  name: 'codeBlock',
  // Higher priority than StarterKit's built-in codeBlock (priority 50)
  priority: 100,
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'typescript',
        parseHTML: (element) =>
          element.getAttribute('data-language') ||
          element.className.match(/language-(\w+)/)?.[1] ||
          'typescript',
        renderHTML: (attrs) => ({
          'data-language': String(attrs.language),
          class: `language-${attrs.language}`,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'pre', preserveWhitespace: 'full' as const }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      {
        ...HTMLAttributes,
        'data-language': HTMLAttributes['data-language'] || 'typescript',
        class: `language-${HTMLAttributes['data-language'] || 'typescript'}`,
      },
      0,
    ]
  },

  addNodeView() {
    // E3: stopEvent prevents the NodeView from intercepting events meant for the editor
    return ReactNodeViewRenderer(ShikiCodeBlockComponent, { stopEvent: () => false })
  },
})
