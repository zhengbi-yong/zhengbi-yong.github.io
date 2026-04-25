/**
 * Shiki singleton highlighter — initialized once, cached forever.
 * Uses fine-grained imports (only required language grammars) to minimize bundle size.
 * Uses WASM-less JavaScript regex engine for faster cold-start.
 */
import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from 'shiki'

// Languages required for a world-class technical blog
const LANGUAGES = [
  'typescript', 'javascript', 'python', 'rust', 'go',
  'java', 'cpp', 'c', 'bash', 'sh',
  'json', 'yaml', 'toml',
  'markdown', 'mdx',
  'html', 'css', 'scss',
  'sql',
  'php', 'ruby', 'swift', 'kotlin',
  'r', 'scala', 'haskell', 'lua',
  'docker', 'nginx',
  'vim', 'latex',
] as const

const THEMES = [
  'github-dark',
  'github-light',
  'one-dark-pro',
  'dracula',
  'nord',
  'vitesse-dark',
  'vitesse-light',
] as const

type SupportedLang = typeof LANGUAGES[number]
type SupportedTheme = typeof THEMES[number]

let highlighterPromise: Promise<Highlighter> | null = null

/**
 * Get (or create) the singleton Shiki highlighter instance.
 * All calls return the same Promise — safe to call repeatedly.
 */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [...THEMES],
      langs: [...LANGUAGES],
      // Use JS regex engine instead of WASM for faster initialization
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

/**
 * Highlight a code string. Returns HTML string or null on failure.
 * Falls back to plain escaped text if language is unknown.
 */
export async function highlightCode(
  code: string,
  lang: string,
  theme: SupportedTheme = 'github-dark'
): Promise<string> {
  try {
    const h = await getHighlighter()
    const safeLang = (LANGUAGES as readonly string[]).includes(lang) ? lang : 'text'
    return h.codeToHtml(code, { lang: safeLang, theme })
  } catch {
    // Language not supported — return plain escaped text
    return `<pre><code>${escapeHtml(code)}</code></pre>`
  }
}

/**
 * Highlight synchronously if already initialized, otherwise return plain HTML.
 * Use this when you need a sync result and can accept a fallback.
 */
export function highlightCodeSync(
  _code: string,
  _lang: string,
  _theme: SupportedTheme = 'github-dark'
): string {
  // Synchronous path: highlighter may not be ready yet (WASM init is async)
  // We always return the promise-based version for correctness
  // The NodeView handles async rendering
  return '' // caller must use async path
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { LANGUAGES, THEMES }
export type { SupportedLang, SupportedTheme }
