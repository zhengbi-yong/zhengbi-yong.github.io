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

function normalizeSegment(segment: string) {
  let normalized = segment

  normalized = normalized.replace(/\bdata=\{`([\s\S]*?)`\}/g, (_, value: string) => {
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
    return `<KatexRenderer math="${escapedMath}" display={true} />`
  })

  // 转换行内公式 $...$ (不跨行)
  // 排除了 | 符号，避免 $150 | $200 这样表格单元格内的 $ 被错误匹配
  content = content.replace(/\$([^$\n|]+?)\$/g, (_, math) => {
    const escapedMath = escapeHtml(math.trim())
    return `<KatexRenderer math="${escapedMath}" display={false} />`
  })

  // 恢复被保护的表格行
  content = content.replace(/__TABLE_ROW_(\d+)__/g, (_, index) => {
    return tableRows[parseInt(index)]
  })

  // 恢复被保护的内容
  content = content.replace(/__PROTECTED_BLOCK_(\d+)__/g, (_, index) => {
    return protectedBlocks[parseInt(index)]
  })

  return content
}

export function normalizeRuntimeMdxContent(content: string) {
  // 先转换数学公式
  const processed = convertMathFormulas(content)

  // 然后处理组件属性
  const segments = processed.split(/(```[\s\S]*?```)/g)

  return segments
    .map((segment) => (segment.startsWith('```') ? segment : normalizeSegment(segment)))
    .join('')
}
