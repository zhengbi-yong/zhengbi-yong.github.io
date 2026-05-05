/**
 * Shiki singleton highlighter — initialized once, cached forever.
 * Uses fine-grained imports (only required language grammars) to minimize bundle size.
 * Uses WASM-less JavaScript regex engine for faster cold-start.
 */
import { createHighlighter, createJavaScriptRegexEngine, type Highlighter, type ThemedToken } from 'shiki'

// Languages required for a world-class technical blog
// IDs must match shiki's registered language names exactly.
// Use 'shellscript' (not 'bash'/'sh') — shiki maps the user's lang to its internals.
const LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'cpp',
  'c',
  'shellscript',
  'json',
  'yaml',
  'toml',
  'markdown',
  'mdx',
  'html',
  'css',
  'scss',
  'sql',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'r',
  'scala',
  'haskell',
  'lua',
  'docker',
  'nginx',
  'vim',
  'latex',
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

type SupportedLang = (typeof LANGUAGES)[number]
type SupportedTheme = (typeof THEMES)[number]

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

/** Result from token-level highlighting */
export interface HighlightTokensResult {
  /** 2D array: tokens[row][col] — each row is a code line */
  tokens: ThemedToken[][]
  /** Foreground color (default text color for the theme) */
  fg: string
  /** Background color */
  bg: string
  /** Theme name */
  themeName: string
}

/**
 * Highlight a code string using Shiki's token API.
 * Returns token-level data so CodeBlock.tsx can build its own HTML
 * with exact control over line count — avoiding trailing-empty-line bugs.
 *
 * Falls back to null on failure (unknown language, etc.).
 */
export async function highlightCodeToTokens(
  code: string,
  lang: string,
  theme: SupportedTheme = 'github-dark'
): Promise<HighlightTokensResult | null> {
  try {
    const h = await getHighlighter()
    const safeLang = (LANGUAGES as readonly string[]).includes(lang) ? lang : 'text'
    const result = h.codeToTokens(code, { lang: safeLang, theme })
    return {
      tokens: result.tokens as ThemedToken[][],
      fg: result.fg,
      bg: result.bg,
      themeName: result.themeName,
    }
  } catch {
    return null
  }
}

/**
 * Pre-highlight a code string in BOTH light and dark themes.
 * Returns both variants so CodeBlock.tsx can switch between them
 * instantly via CSS instead of re-running Shiki on every theme toggle.
 */
export interface DualHighlightResult {
  dark: HighlightTokensResult | null
  light: HighlightTokensResult | null
}

export async function highlightCodeBothThemes(
  code: string,
  lang: string
): Promise<DualHighlightResult> {
  const [dark, light] = await Promise.all([
    highlightCodeToTokens(code, lang, 'github-dark'),
    highlightCodeToTokens(code, lang, 'github-light'),
  ])
  return { dark, light }
}

/**
 * Build HTML for a single line of code from token data.
 * Preserves syntax highlighting colors from Shiki.
 */
export function buildLineHtml(tokens: ThemedToken[]): string {
  if (tokens.length === 0) {
    // Empty line — no content, CSS min-height makes it visible
    return ''
  }
  return tokens
    .map(t => `<span style="color:${t.color}">${escapeHtml(t.content)}</span>`)
    .join('')
}

/**
 * Build complete inner HTML for a code block from token data.
 * Limits to expectedLines to discard Shiki's trailing empty line.
 *
 * Empty .line spans rely on CSS min-height for visibility (no \u00a0
 * hacks — clean copy/paste).
 *
 * Returns { html, fg, bg } — the caller should use fg/bg as the
 * code block container's color/background-color to match Shiki's theme.
 */
export function buildCodeBlockHtml(
  tokens: ThemedToken[][],
  expectedLines: number,
  fg: string,
  bg: string
): { html: string; fg: string; bg: string } {
  const limited = tokens.slice(0, expectedLines)
  const html = limited
    .map(lineTokens => {
      const inner = buildLineHtml(lineTokens)
      return `<span class="line">${inner}</span>`
    })
    .join('\n')
  return { html, fg, bg }
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
