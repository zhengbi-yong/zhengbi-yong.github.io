const NUMERIC_PROPS = ['height', 'width', 'radius', 'bits', 'atomLabelSize', 'bondWidth']
const BOOLEAN_PROPS = ['showDetails', 'autoRotate', 'showAtomNumbers']

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary)
  }

  throw new Error('Base64 encoding is unavailable in the current runtime')
}

/**
 * Extract a balanced brace/bracket expression starting at `startPos`.
 * Handles nested braces ({}) and brackets ([]).  Returns the extracted
 * substring INCLUSIVE of the closing delimiter, or null if unbalanced.
 */
function extractBalancedExpression(text: string, startPos: number): string | null {
  const openChar = text[startPos]
  const closeChar = openChar === '{' ? '}' : openChar === '[' ? ']' : null
  if (closeChar === null) return null

  let depth = 1
  let i = startPos + 1

  for (; i < text.length; i++) {
    if (text[i] === openChar) depth++
    else if (text[i] === closeChar) {
      depth--
      if (depth === 0) return text.slice(startPos, i + 1)
    }
  }

  return null // unbalanced
}

/**
 * Convert complex JSX expression props (objects and arrays) to base64
 * string attributes so next-mdx-remote can parse them.
 *
 * Handles:
 *   option={{...}}  → optionBase64="<base64>"
 *   data={[...]}    → dataBase64="<base64>"
 *   keys={[...]}    → keysBase64="<base64>"
 *
 * Works by scanning for prop={[ prefix and using balanced-brace matching
 * to extract the full expression, then replacing the whole thing.
 */
function normalizeChartProps(segment: string): string {
  const COMPLEX_PROPS: Array<{ prop: string; target: string }> = [
    { prop: 'option', target: 'optionBase64' },
    { prop: 'data', target: 'dataBase64' },
    { prop: 'keys', target: 'keysBase64' },
  ]

  let result = segment

  for (const { prop, target } of COMPLEX_PROPS) {
    // Pattern: `prop={` followed by `{` (object) or `[` (array)
    // We look for: prop={ {  or  prop={ [
    const prefix = `${prop}={`

    let searchFrom = 0
    while (true) {
      const startIdx = result.indexOf(prefix, searchFrom)
      if (startIdx === -1) break

      // Find the first brace after `prop={`
      const exprOpenIdx = startIdx + prefix.length
      if (exprOpenIdx >= result.length) break

      const exprOpenChar = result[exprOpenIdx]
      if (exprOpenChar !== '{' && exprOpenChar !== '[') {
        searchFrom = startIdx + 1
        continue
      }

      // Extract the balanced expression (the JS object or array)
      const jsBlock = extractBalancedExpression(result, exprOpenIdx)
      if (!jsBlock) {
        searchFrom = startIdx + 1
        continue
      }

      // Now find the closing } for the JSX expression container
      // It's right after the jsBlock
      const jSXCloseIdx = exprOpenIdx + jsBlock.length
      if (jSXCloseIdx >= result.length || result[jSXCloseIdx] !== '}') {
        searchFrom = startIdx + 1
        continue
      }

      // The full matched span: `prop={ { ... } }` or `prop={ [ ... ] }`
      const fullMatch = result.slice(startIdx, jSXCloseIdx + 1)

      // Encode the JS block (without the outer JSX {}) as base64
      const encoded = encodeBase64Utf8(jsBlock)

      // Replace: `prop={ { ... } }` → `target="<base64>"`
      const replacement = `${target}="${encoded}"`
      result = result.slice(0, startIdx) + replacement + result.slice(jSXCloseIdx + 1)

      // Continue from after the replacement
      searchFrom = startIdx + replacement.length
    }
  }

  return result
}

function normalizeSegment(segment: string) {
  let normalized = normalizeChartProps(segment)

  // Handle template-literals: data={`...`} → dataBase64="..."
  normalized = normalized.replace(/\bdata=\{`([\s\S]*?)`\}/g, (_, value: string) => {
    return `dataBase64="${encodeBase64Utf8(value)}"`
  })

  // Handle BROKEN template-literals where backticks were lost in storage:
  // data={3 Water...} → dataBase64="..."
  // Matches data={ followed by content (no curly braces) up to the closing }
  normalized = normalized.replace(/\bdata=\{([^}]+)\}/g, (_, value: string) => {
    return `dataBase64="${encodeBase64Utf8(value)}"`
  })

  for (const prop of NUMERIC_PROPS) {
    const expressionPattern = new RegExp(`\\b${prop}=\\{(-?\\d+(?:\\.\\d+)?)\\}`, 'g')
    normalized = normalized.replace(expressionPattern, `${prop}="$1"`)
  }

  for (const prop of BOOLEAN_PROPS) {
    const expressionPattern = new RegExp(`\\b${prop}=\\{(true|false)\\}`, 'g')
    normalized = normalized.replace(expressionPattern, `${prop}="$1"`)
  }

  return normalized
}

/**
 * 将数学公式转换为 KatexRenderer 组件
 * 支持：$...$ (行内) 和 $$...$$ (块级)
 *
 * 注意：需要对公式内容进行 HTML 转义，避免破坏属性值
 * 并且避免转换代码块和表格中的内容
 */
function convertMathFormulas(content: string): string {
  // HTML 转义函数
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // 保护代码块，避免处理其中的特殊字符
  const protectedBlocks: string[] = []

  // 保护代码块
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    protectedBlocks.push(match)
    return `__PROTECTED_BLOCK_${protectedBlocks.length - 1}__`
  })

  // 保护行内代码块（``...``），避免处理其中的 $ 符号（如价格 $150）
  content = content.replace(/`[^`\n]+`/g, (match) => {
    protectedBlocks.push(match)
    return `__PROTECTED_BLOCK_${protectedBlocks.length - 1}__`
  })

  // 保护表格行（以 | 开头），避免其中的 $ 符号（如价格列 $150-250）被误匹配
  // 表格行格式: | cell | cell | ... （可能有多行）
  const tableRows: string[] = []
  content = content.replace(/^(\|.*\|)\s*$/gm, (match) => {
    tableRows.push(match)
    return `__TABLE_ROW_${tableRows.length - 1}__`
  })

  // 转换块级公式 $$...$$ (支持跨行)
  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const escapedMath = escapeHtml(math.trim())
    return `<KatexRenderer math="${escapedMath}" display="true" />`
  })

  // 转换行内公式 $...$ (不跨行)
  // 排除了 | 符号，避免 $150 | $200 这样表格单元格内的 $ 被错误匹配
  content = content.replace(/\$([^$\n|]+?)\$/g, (_, math) => {
    const escapedMath = escapeHtml(math.trim())
    return `<KatexRenderer math="${escapedMath}" display={false} />`
  })

  // 恢复被保护的表格行
  content = content.replace(/__TABLE_ROW_(\d+)__/g, (_, index) => {
    return tableRows[parseInt(index)] ?? ''
  })

  // 恢复被保护的内容
  content = content.replace(/__PROTECTED_BLOCK_(\d+)__/g, (_, index) => {
    return protectedBlocks[parseInt(index)] ?? ''
  })

  return content
}

/**
 * Escape bare < and > characters that MDX would misinterpret as JSX tags.
 *
 * MDX treats `<http://...>` and `<...>` as JSX components, throwing:
 *   "Unexpected character `/` (U+002F) before local name"
 *
 * This converts Markdown auto-link syntax to proper Markdown links,
 * and escapes any remaining unbalanced angle brackets.
 */
function escapeMdxUnsafeContent(content: string): string {
  // 1. Convert Markdown auto-links <https://...> to [url](url)
  //    Standard Markdown auto-link syntax is NOT valid MDX.
  content = content.replace(
    /<((?:https?|ftp|mailto):\/\/[^\s>]+)>/g,
    (_match: string, url: string) => `[${url}](${url})`
  )

  // 2. Protect known HTML tags and JSX components
  const protectedTags: string[] = []
  content = content.replace(
    /<\/?\w[\w-]*(?:\s[^>]*)?\/?>/g,
    (match: string) => {
      protectedTags.push(match)
      return `__PROTECTED_TAG_${protectedTags.length - 1}__`
    }
  )

  // 3. Escape remaining bare < and > (stray angle brackets in text)
  content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 4. Restore protected tags
  content = content.replace(
    /__PROTECTED_TAG_(\d+)__/g,
    (_match: string, index: string) => protectedTags[parseInt(index)] ?? ''
  )

  return content
}

export function normalizeRuntimeMdxContent(content: string) {
  // 先转换数学公式
  const processed = convertMathFormulas(content)

  // 然后处理组件属性
  const segments = processed.split(/(```[\s\S]*?```)/g)

  const normalized = segments
    .map((segment) => (segment.startsWith('```') ? segment : normalizeSegment(segment)))
    .join('')

  // 最后转义 MDX 不兼容的角括号
  return escapeMdxUnsafeContent(normalized)
}
