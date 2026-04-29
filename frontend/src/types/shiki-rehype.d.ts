declare module '@shikijs/rehype' {
  import type { Plugin } from 'unified'
  import type { HighlighterGeneric, BuiltinLanguage, BuiltinTheme } from 'shiki'

  interface RehypeShikiOptions {
    highlighter?: HighlighterGeneric<BuiltinLanguage, BuiltinTheme>
    langs?: Array<BuiltinLanguage | { id: string; scopeName: string; path: string }>
    theme?: BuiltinTheme | 'github-dark' | 'github-light' | Record<string, BuiltinTheme>
    themes?: Record<string, BuiltinTheme>
    defaultLanguage?: string
    fallbackLanguage?: string
    addLanguageClass?: boolean
  }

  const rehypeShiki: Plugin<[RehypeShikiOptions?]>
  export default rehypeShiki
}

declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}
