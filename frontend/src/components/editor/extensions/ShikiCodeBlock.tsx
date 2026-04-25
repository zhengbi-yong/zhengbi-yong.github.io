import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { highlightCode } from '@/lib/shiki-highlighter'
import { cn } from '@/lib/utils'

function ShikiCodeBlockComponent({ node }: NodeViewProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const language = node.attrs.language as string || 'typescript'

  useEffect(() => {
    let cancelled = false

    async function highlight() {
      if (!codeRef.current) return

      const code = codeRef.current.textContent || ''
      try {
        const html = await highlightCode(code, language)
        if (!cancelled) {
          setHighlightedHtml(html)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    highlight()

    return () => {
      cancelled = true
    }
  }, [language])

  const handleCopy = async () => {
    if (!codeRef.current) return
    const code = codeRef.current.textContent || ''
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Extract just the inner content from Shiki's html (remove pre wrapper)
  const extractCodeContent = (html: string) => {
    const match = html.match(/<pre[^>]*><code[^>]*>([\s\S]*)<\/code><\/pre>/)
    return match ? match[1] : html
  }

  return (
    <NodeViewWrapper>
      <div className="relative group my-4">
        {/* Language label */}
        <div className="absolute top-2 left-3 text-xs text-muted-foreground font-mono z-10">
          {language}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-accent/50',
            copied && 'text-green-500'
          )}
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>

        {/* Code content */}
        <div className="rounded-lg overflow-hidden border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="animate-pulse text-sm">Highlighting...</div>
            </div>
          ) : highlightedHtml ? (
            <pre
              className="p-4 pt-8 overflow-x-auto text-sm"
              dangerouslySetInnerHTML={{
                __html: extractCodeContent(highlightedHtml),
              }}
            />
          ) : (
            <pre className="p-4 pt-8 overflow-x-auto text-sm font-mono">
              <code ref={codeRef}>{node.textContent}</code>
            </pre>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const ShikiCodeBlock = Node.create({
  name: 'codeBlock',

  group: 'block',

  content: 'text*',

  marks: '',

  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'typescript',
        parseHTML: (element) => {
          const language = (element as HTMLElement).getAttribute('data-language')
          return language || (element as HTMLElement).className.match(/language-(\w+)/)?.[1] || 'typescript'
        },
        renderHTML: (attributes) => ({
          'data-language': attributes.language,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        getAttrs: (element) => {
          const language =
            (element as HTMLElement).dataset.language ||
            (element as HTMLElement).className.match(/language-(\w+)/)?.[1] ||
            'typescript'
          return { language }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, { 'data-language': HTMLAttributes['data-language'] || 'typescript' }),
      ['code', {}, 0],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShikiCodeBlockComponent)
  },
})
