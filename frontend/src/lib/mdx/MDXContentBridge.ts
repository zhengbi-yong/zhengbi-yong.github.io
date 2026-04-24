/**
 * MDXContentBridge — MDX 内容与 Tiptap 编辑器之间的双向转换工具
 *
 * 问题背景：
 * - MDX 包含 MDX 专属语法（数学公式、JSX 组件等），Tiptap 无法直接解析
 * - Tiptap 输出 HTML，turndown 转 Markdown 时无法还原 MDX 语法
 * - 解决方案：加载时将 MDX 特殊语法替换为 Tiptap 可渲染的占位符，
 *   保存时将占位符还原为 MDX 语法
 *
 * 转换流程：
 *   [MDX 原文] ──loadToEditor()──→ [Tiptap 安全文本] ──turndown──→ [Markdown] ──saveToMdx()──→ [MDX 原文]
 *
 * 支持的 MDX 语法：
 * - 块级数学公式：$$...$$
 * - 行内数学公式：$...$
 * - JSX 标签：<FadeIn>, <SlideIn>, <Callout>, <Steps>, <Image>, <CodeBlock>,
 *            <Excalidraw>, <SheetMusic>, <AnimatedSection>, <AnimatedList>,
 *            <ScaleIn>, <RotateIn>, <BounceIn>, <ConfettiOnView> 等
 */

// ==================== 类型 ====================

interface BridgeResult {
  content: string
  mathBlockCount: number
  mathInlineCount: number
  componentCount: number
  codeBlockCount: number
}

interface RestoreResult {
  content: string
  restored: number
}

interface Match {
  original: string
  placeholder: string
}

// ==================== 常量 ====================

// 占位符前缀（使用不可见的 Unicode 控制字符作为边界标记，防止与正常内容冲突）
const MATH_BLOCK_PREFIX = '\u0002MATHBLOCK\u0003'
const MATH_INLINE_PREFIX = '\u0002MATHINLINE\u0003'
const COMPONENT_PREFIX = '\u0002MDXCOMP\u0003'

// ==================== 辅助函数 ====================

/**
 * 生成唯一占位符
 */
function makePlaceholder(type: string, id: number, content?: string): string {
  if (content !== undefined) {
    // 内容已 Base64 编码，放在占位符中
    return `${type}${id}:${content}\u0003`
  }
  return `${type}${id}\u0003`
}

/**
 * Base64 编码（URL 安全）
 */
function toBase64(str: string): string {
  // 使用 btoa 并处理 Unicode
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ))
  } catch {
    return btoa(str)
  }
}

/**
 * Base64 解码
 */
function fromBase64(b64: string): string {
  try {
    return decodeURIComponent(
      atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
  } catch {
    return atob(b64)
  }
}

// ==================== 核心转换函数 ====================

/**
 * 将 MDX 内容转换为 Tiptap 可安全编辑的格式
 *
 * 策略：
 * 1. 块级数学公式 $$...$$ → Base64 编码，用特殊标记包裹
 * 2. 行内数学公式 $...$ → Base64 编码，用特殊标记包裹
 * 3. JSX 组件标签 → Base64 编码，用特殊标记包裹
 * 4. 代码块语言标记行 → 保留原样（Tiptap CodeBlockLowlight 支持）
 *
 * @param mdxContent 原始 MDX 内容
 * @returns Tiptap 安全的内容字符串
 */
export function loadToEditor(mdxContent: string): BridgeResult {
  const mathBlocks: Match[] = []
  const mathInlines: Match[] = []
  const components: Match[] = []
  const codeBlocks: Match[] = []

  let result = mdxContent

  // 步骤 1: 处理块级数学公式 $$...$$
  // 匹配 $$latex$$（允许跨行）
  result = result.replace(/\$\$[\s\S]+?\$\$/g, (match) => {
    const id = mathBlocks.length
    const encoded = toBase64(match)
    const placeholder = makePlaceholder(MATH_BLOCK_PREFIX, id, encoded)
    mathBlocks.push({ original: match, placeholder })
    return placeholder
  })

  // 步骤 2: 处理行内数学公式 $...$
  // 匹配 $latex$，但排除已处理的 $$（通过检查前面没有 $）
  result = result.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match) => {
    const id = mathInlines.length
    const encoded = toBase64(match)
    const placeholder = makePlaceholder(MATH_INLINE_PREFIX, id, encoded)
    mathInlines.push({ original: match, placeholder })
    return placeholder
  })

  // 步骤 3: 处理 JSX 组件标签
  // 匹配自闭合标签：<ComponentName ... />
  result = result.replace(/<([A-Z][a-zA-Z]*)([^>]*?)\/>/g, (match, tagName) => {
    // 跳过普通 HTML 标签（如 <br />, <hr />）
    const commonHtmlTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'])
    if (commonHtmlTags.has(tagName.toLowerCase())) {
      return match
    }

    const id = components.length
    const encoded = toBase64(match)
    const placeholder = makePlaceholder(COMPONENT_PREFIX, id, encoded)
    components.push({ original: match, placeholder })
    return placeholder
  })

  // 步骤 4: 处理带子元素的 JSX 组件标签
  // 匹配开标签：<ComponentName ...>...</ComponentName>
  result = result.replace(/<([A-Z][a-zA-Z]*)([^>]*?)>([\s\S]*?)<\/\1>/g, (match, tagName) => {
    // 跳过普通 HTML 标签
    const commonHtmlTags = new Set(['div', 'span', 'p', 'section', 'article', 'main', 'header', 'footer', 'aside', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'a', 'button', 'form', 'input', 'select', 'textarea'])
    if (commonHtmlTags.has(tagName.toLowerCase())) {
      return match
    }

    const id = components.length
    const encoded = toBase64(match)
    const placeholder = makePlaceholder(COMPONENT_PREFIX, id, encoded)
    components.push({ original: match, placeholder })
    return placeholder
  })

  return {
    content: result,
    mathBlockCount: mathBlocks.length,
    mathInlineCount: mathInlines.length,
    componentCount: components.length,
    codeBlockCount: codeBlocks.length,
  }
}

/**
 * 将 Tiptap → turndown → Markdown 的内容还原为 MDX 格式
 *
 * @param markdownContent turndown 输出的 Markdown 内容
 * @param originalMdxContent 原始 MDX 内容（用于还原）
 * @returns MDX 格式内容
 */
export function saveToMdx(markdownContent: string, originalMdxContent: string): RestoreResult {
  let result = markdownContent
  let restored = 0

  // 从原始 MDX 中提取占位符映射
  const mathBlockMap = new Map<number, string>()
  const mathInlineMap = new Map<number, string>()
  const componentMap = new Map<number, string>()

  // 从原始内容中提取所有占位符
  // eslint-disable-next-line no-control-regex -- \u0002/\u0003 are intentional ASCII delimiters for serialization
  const placeholderRegex = /\u0002([A-Z]+)(\d+):(.+?)\u0003/g
  let placeholderMatch: RegExpExecArray | null
  while ((placeholderMatch = placeholderRegex.exec(originalMdxContent)) !== null) {
    const type = placeholderMatch[1]
    const id = parseInt(placeholderMatch[2], 10)
    const encoded = placeholderMatch[3]
    const decoded = fromBase64(encoded)

    switch (type) {
      case 'MATHBLOCK':
        mathBlockMap.set(id, decoded)
        break
      case 'MATHINLINE':
        mathInlineMap.set(id, decoded)
        break
      case 'MDXCOMP':
        componentMap.set(id, decoded)
        break
    }
  }

  // 还原块级数学公式
  // eslint-disable-next-line no-control-regex -- \u0002/\u0003 are intentional ASCII delimiters
  result = result.replace(/\u0002MATHBLOCK(\d+)\u0003/g, (match, idStr) => {
    const id = parseInt(idStr, 10)
    const original = mathBlockMap.get(id)
    if (original !== undefined) {
      restored++
      return original
    }
    return match
  })

  // 还原行内数学公式
  // eslint-disable-next-line no-control-regex -- \u0002/\u0003 are intentional ASCII delimiters
  result = result.replace(/\u0002MATHINLINE(\d+)\u0003/g, (match, idStr) => {
    const id = parseInt(idStr, 10)
    const original = mathInlineMap.get(id)
    if (original !== undefined) {
      restored++
      return original
    }
    return match
  })

  // 还原 JSX 组件
  // eslint-disable-next-line no-control-regex -- \u0002/\u0003 are intentional ASCII delimiters
  result = result.replace(/\u0002MDXCOMP(\d+)\u0003/g, (match, idStr) => {
    const id = parseInt(idStr, 10)
    const original = componentMap.get(id)
    if (original !== undefined) {
      restored++
      return original
    }
    return match
  })

  return { content: result, restored }
}

/**
 * 专门用于还原数学公式（供 TiptapEditor 的 turndown 转换后调用）
 *
 * @param markdownAfterTurndown turndown 转换后的 Markdown 内容
 * @param originalMdxContent 原始 MDX 内容
 */
export function restoreMathFormulas(markdownAfterTurndown: string, originalMdxContent: string): string {
  return saveToMdx(markdownAfterTurndown, originalMdxContent).content
}

// ==================== 开发调试 ====================

/**
 * 验证转换的往返一致性
 * 将 MDX → loadToEditor() → saveToMdx()，比较结果
 */
export function roundtripTest(mdxContent: string): {
  success: boolean
  original: string
  afterRoundtrip: string
  diff: string[]
} {
  const { content: editorContent } = loadToEditor(mdxContent)
  const { content: restored } = saveToMdx(editorContent, mdxContent)

  // 简单的相似度检查（去掉空白后比较）
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  const success = normalize(restored) === normalize(mdxContent)

  const diff: string[] = []
  if (!success) {
    diff.push(`原始长度: ${mdxContent.length}`)
    diff.push(`还原后长度: ${restored.length}`)
    // 显示前 200 个字符的差异
    const orig = normalize(mdxContent).slice(0, 200)
    const rest = normalize(restored).slice(0, 200)
    if (orig !== rest) {
      diff.push(`原文片段: ${orig}`)
      diff.push(`还原片段: ${rest}`)
    }
  }

  return {
    success,
    original: mdxContent,
    afterRoundtrip: restored,
    diff,
  }
}
