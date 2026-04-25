'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ShikiCodeBlockComponent } from './ShikiCodeBlockComponent'

// ------------------------------------------------------------------------------------------------
// ShikiCodeBlock — replaces StarterKit's plain codeBlock with Shiki-powered highlighting.
// Uses a custom React NodeView registered via priority:100 (StarterKit codeBlock is priority:50).
// The toggleCodeBlock command comes from StarterKit (we no longer disable codeBlock:false).
// ------------------------------------------------------------------------------------------------
export const ShikiCodeBlock = Node.create({
  name: 'codeBlock',
  // Higher priority than StarterKit's built-in codeBlock (priority 50)
  // This means our parseHTML/renderHTML/addNodeView win over StarterKit's for <pre> tags
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
    // stopEvent: false → let ProseMirror handle keyboard events (Tab, Enter, etc.)
    return ReactNodeViewRenderer(ShikiCodeBlockComponent, { stopEvent: () => false })
  },
})
