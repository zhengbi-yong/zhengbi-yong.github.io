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
 * Matches ANY prop with `={{` or `={[` prefix (generic, not just
 * option/data/keys) and converts to base64:
 *
 *   anyProp={{...}}  → anyPropBase64="<base64>"
 *   anyProp={[...]}  → anyPropBase64="<base64>"
 *
 * Also handles the legacy template-literal format:
 *   data={`...`}     → dataBase64="<base64>"
 *
 * Works by scanning for prop={[ prefix and using balanced-brace matching
 * to extract the full expression, then replacing the whole thing.
 */
function normalizeChartProps(segment: string): string {
  let result = segment

  // ── Phase 1: Generic complex prop handler (any prop with ={{ or ={[) ──
  // Match: wordChar+={ immediately followed by { or [
  const complexPattern = /(\w+)=\{(?=[\{[])/g
  let match: RegExpExecArray | null

  // Collect replacement candidates first to avoid index-shifting issues
  const replacements: Array<{ start: number; end: number; replacement: string }> = []

  while ((match = complexPattern.exec(result)) !== null) {
    const prop = match[1]
    const exprStartIdx = match.index + prop.length + 2 // position of { or [

    if (exprStartIdx >= result.length) continue

    // Extract the balanced expression (the JS object or array)
    const jsBlock = extractBalancedExpression(result, exprStartIdx)
    if (!jsBlock) continue

    // Find the closing } for the JSX expression container
    const jSXCloseIdx = exprStartIdx + jsBlock.length
    if (jSXCloseIdx >= result.length || result[jSXCloseIdx] !== '}') continue

    // Encode the JS block (without the outer JSX {}) as base64
    const encoded = encodeBase64Utf8(jsBlock)
    const replacement = `${prop}Base64="${encoded}"`

    replacements.push({
      start: match.index,
      end: jSXCloseIdx + 1,
      replacement,
    })
  }

  // Apply replacements in reverse order to preserve indices
  for (const r of replacements.reverse()) {
    result = result.slice(0, r.start) + r.replacement + result.slice(r.end)
  }

  // ── Phase 2: Template-literal handler (generic) ──
  // prop={`value`} → propBase64="<base64>"
  // Handles multi-line strings, XYZ structures, and any other
  // prop whose value needs template-literal wrapping.
  const templateLiteralPattern = /(\w+)={`([\s\S]*?)`}/g
  let tlMatch: RegExpExecArray | null
  while ((tlMatch = templateLiteralPattern.exec(result)) !== null) {
    const prop = tlMatch[1]
    const value = tlMatch[2]
    const encoded = encodeBase64Utf8(value)
    result = result.slice(0, tlMatch.index) +
      `${prop}Base64="${encoded}"` +
      result.slice(tlMatch.index + tlMatch[0].length)
    templateLiteralPattern.lastIndex = tlMatch.index + prop.length + 11 + encoded.length
  }

  // Handle BROKEN template-literals where backticks were lost in storage:
  // prop={3 Water...} → propBase64="..."
  result = result.replace(/(\w+)={([^}]+)}/g, (_, prop: string, value: string) => {
    return `${prop}Base64="${encodeBase64Utf8(value)}"`
  })

  // ── Phase 3: String-encoded JSON objects ──
  // option="{\"title\":...}"  →  optionBase64="<base64>"
  // Handles the case where complex props are stored as JSON-encoded
  // strings inside JSX string attributes.
  const stringJsonPattern = /(\w+)="(\{[\s\S]*?\})"/g
  let stringMatch: RegExpExecArray | null
  while ((stringMatch = stringJsonPattern.exec(result)) !== null) {
    const prop = stringMatch[1]
    const jsonStr = stringMatch[2]
    // Skip if already handled by Phase 1 or contains nested tags
    try {
      // Try parsing as JSON first — if it succeeds, encode the parsed
      // data so the component can decode it reliably.
      const parsed = JSON.parse(jsonStr)
      const encoded = encodeBase64Utf8(JSON.stringify(parsed))
      result = result.slice(0, stringMatch.index) +
        `${prop}Base64="${encoded}"` +
        result.slice(stringMatch.index + stringMatch[0].length)
      // Reset regex since we modified the string
      stringJsonPattern.lastIndex = stringMatch.index + prop.length + 11 + encoded.length
    } catch {
      // Not valid JSON — try encoding the raw object literal.
      // Components like resolveDataProp will attempt JSON.parse(atob(...))
      // which will fail; but this at least preserves the data.
      // TODO: fix data at source (BlockNote editor serialization)
      const encoded = encodeBase64Utf8(jsonStr)
      result = result.slice(0, stringMatch.index) +
        `${prop}Base64="${encoded}"` +
        result.slice(stringMatch.index + stringMatch[0].length)
      stringJsonPattern.lastIndex = stringMatch.index + prop.length + 11 + encoded.length
    }
  }

  return result
}

function normalizeSegment(segment: string) {
  let normalized = normalizeChartProps(segment)

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

  // 3. Escape remaining bare < (angle brackets in text)
  //    DO NOT escape > — Markdown blockquote syntax ("> ") and
  //    other legitimate uses of > break if escaped to &gt;
  content = content.replace(/</g, '&lt;')

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
