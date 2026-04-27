const { serialize } = require('next-mdx-remote/serialize')
const remarkMath = require('remark-math')
const { createHighlighter } = require('shiki')

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function unescapeMdx(s) {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\$/g, '$')
}

async function highlightCodeBlocks(compiledSource, h) {
  // Step 1: Find all _jsxDEV(_components.code, ...) positions and their context
  // The pattern: _jsxDEV(_components.code, { ... className: "language-XX" ... children: "..." ... }, ...)
  // We extract className and children via separate simple lookups

  const codeBlockRegex = /_jsxDEV\(_components\.code,/g
  const results = []
  let match

  while ((match = codeBlockRegex.exec(compiledSource)) !== null) {
    const startIdx = match.index
    // Find the matching closing paren by counting braces
    let braceDepth = 0
    let inString = false
    let stringChar = ''
    let endIdx = startIdx
    let i = match.index + match[0].length

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
        if (c === stringChar && compiledSource[i-1] !== '\\') {
          inString = false
        }
      }
    }

    const block = compiledSource.substring(startIdx, endIdx)

    // Extract className
    const classNameMatch = /className:\s*"([^"]+)"/.exec(block)
    // Extract children (the 3rd positional arg after {, before , undefined)
    // children is the 2nd property after className
    const childrenMatch = /children:\s*"((?:[^"\\]|\\.)*)"/.exec(block)

    if (classNameMatch && childrenMatch) {
      const langClass = classNameMatch[1]
      const rawCode = childrenMatch[1]
      const lang = langClass.replace('language-', '').toLowerCase()
      const code = unescapeMdx(rawCode)

      results.push({ startIdx, endIdx, lang, code, fullBlock: block })
    }
  }

  console.log(`Found ${results.length} code blocks:`)
  results.forEach((r, i) => {
    console.log(`  [${i}] lang=${r.lang}, code=${r.code.substring(0, 30)}`)
  })

  if (results.length === 0) return compiledSource

  // Step 2: Replace each code block with Shiki-highlighted version
  // We build the replacement by calling _jsxDEV("div", { dangerouslySetInnerHTML: ... })
  let result = compiledSource

  for (let i = results.length - 1; i >= 0; i--) {
    const { startIdx, endIdx, lang, code } = results[i]

    let html
    if (lang && h.getLoadedLanguages().includes(lang)) {
      html = h.codeToHtml(code, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
    } else {
      html = `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
    }

    // Escape backticks and ${} to prevent template literal issues
    const escapedHtml = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

    const replacement = `_jsxDEV("div", {className:"not-prose shiki-wrapper", "data-lang":"${lang}", dangerouslySetInnerHTML:{__html:\`${escapedHtml}\`}}, undefined, false, {fileName:"<shiki>",lineNumber:1,columnNumber:1}, arguments[0])`

    result = result.substring(0, startIdx) + replacement + result.substring(endIdx)
  }

  return result
}

const source = '```python\nprint("hello")\n```'

serialize(source, {
  mdxOptions: {
    remarkPlugins: [remarkMath.default || remarkMath],
  },
}).then(async (r) => {
  const h = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['python'],
  })

  const result = await highlightCodeBlocks(r.compiledSource, h)
  console.log('has shiki:', result.includes('shiki'))
  console.log('has dangerously:', result.includes('dangerouslySetInnerHTML'))
  console.log('Preview:', result.substring(0, 500))
}).catch((e) => console.error('Error:', e.message))
