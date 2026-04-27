/**
 * Shared Shiki post-processing utilities for MDX compilation.
 *
 * Problem: @shikijs/rehype (both v3 and v4) internally uses unist-util-visit
 * which crashes when it encounters trees with children: undefined nodes — a
 * condition that remark-gfm can produce in the remark→rehype intermediate tree
 * when processed by next-mdx-remote/serialize's internal compile() call.
 *
 * Solution: Run Shiki AFTER MDX compilation is complete, operating directly on
 * the compiledSource string — bypassing the rehype plugin pipeline entirely.
 */

import { createHighlighter, type Highlighter } from 'shiki'

// ── Shiki singleton ────────────────────────────────────────────────────────────
let _highlighter: Highlighter | null = null
let _initPromise: Promise<Highlighter> | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (_highlighter) return _highlighter
  if (_initPromise) return _initPromise
  _initPromise = createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'javascript', 'typescript', 'python', 'bash', 'sh',
      'rust', 'cpp', 'c', 'java', 'go', 'ruby', 'php',
      'html', 'css', 'scss', 'json', 'yaml', 'toml', 'xml',
      'markdown', 'mdx', 'sql', 'dockerfile', 'makefile',
      'cmake', 'protobuf', 'graphql', 'vim', 'lua',
      'kotlin', 'swift', 'scala', 'r', 'matlab',
      'latex', 'bibtex', 'dart', 'julia',
      'nim', 'crystal', 'verilog',
      'powershell', 'bat', 'groovy',
    ],
  })
  _highlighter = await _initPromise
  return _highlighter
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function unescapeMdx(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\\$/g, '$')
}

// ── Shiki post-processing ─────────────────────────────────────────────────────
export async function highlightCodeBlocks(
  compiledSource: string,
  h: Highlighter,
): Promise<string> {
  try {
    const codeBlockRegex = /_jsxDEV\(_components\.code,/g
    const results: Array<{
      startIdx: number
      endIdx: number
      lang: string
      code: string
    }> = []

    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(compiledSource)) !== null) {
      const startIdx = match.index
      // Find the matching closing brace by counting nesting depth
      let braceDepth = 0
      let inString = false
      let stringChar = ''
      let endIdx = startIdx
      let i = startIdx + match[0].length

      for (; i < compiledSource.length; i++) {
        const c = compiledSource[i]
        if (!inString) {
          if (c === '"' || c === "'" || c === '`') {
            inString = true
            stringChar = c
          } else if (c === '{') {
            braceDepth++
          } else if (c === '}') {
            braceDepth--
            if (braceDepth === 0) {
              endIdx = i + 1
              break
            }
          }
        } else {
          if (c === stringChar && compiledSource[i - 1] !== '\\') {
            inString = false
          }
        }
      }

      const block = compiledSource.substring(startIdx, endIdx)

      const classNameMatch = /className:\s*"([^"]+)"/.exec(block)
      const childrenMatch = /children:\s*"((?:[^"\\]|\\.)*)"/.exec(block)

      if (classNameMatch && childrenMatch) {
        const langClass = classNameMatch[1]
        const rawCode = childrenMatch[1]
        const lang = langClass.replace('language-', '').toLowerCase()
        const code = unescapeMdx(rawCode)
        results.push({ startIdx, endIdx, lang, code })
      }
    }

    if (results.length === 0) return compiledSource

    let result = compiledSource

    // Replace in reverse order to preserve string positions
    for (let i = results.length - 1; i >= 0; i--) {
      const { startIdx, endIdx, lang, code } = results[i]

      let html: string
      if (lang && h.getLoadedLanguages().includes(lang as any)) {
        html = h.codeToHtml(code, {
          lang: lang as any,
          themes: { light: 'github-light', dark: 'github-dark' },
        })
      } else {
        html = `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
      }

      // langAttr must be a properly-quoted JSON property: "data-lang":"python"
      // Using JSON.stringify to ensure both key and value are quoted strings
      const langAttr = JSON.stringify('data-lang') + ':' + JSON.stringify(lang)
      // Encode the Shiki HTML as a JSON string so every character is literal
      const encodedHtml = JSON.stringify(html)
      const replacement =
        '_jsxDEV("div", ' +
        '{className:"not-prose shiki-wrapper", ' + langAttr + ', ' +
        'dangerouslySetInnerHTML:{__html:' + encodedHtml + '}}, ' +
        'undefined, false, {fileName:"<shiki>",lineNumber:1,columnNumber:1}, ' +
        'arguments[0])'

      result = result.substring(0, startIdx) + replacement + result.substring(endIdx)
    }

    return result
  } catch {
    // Brace-counting threw (e.g., malformed input) — fall back to original safely
    return compiledSource
  }
}
