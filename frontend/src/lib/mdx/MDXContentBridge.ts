/**
 * MDXContentBridge — MDX 内容与 Tiptap 编辑器之间的双向转换工具
 *
 * 问题背景：
 * - MDX 包含 MDX 专属语法（数学公式、JSX 组件等），Tiptap 无法直接解析
 * - Tiptap 输出 HTML，turndown 转 Markdown 时无法还原 MDX 语法
 * - 解决方案：加载时将 MDX 先转为 HTML，再注入 Tiptap 可识别的 math HTML。
 *   Tiptap 将 HTML 直接渲染（而非当作纯文本），保存时通过 turndown
 *   转为 Markdown，最后还原为 MDX。
 *
 * 转换流程：
 *   [MDX 原文] ──提取 math/components──→ [纯 Markdown HTML] ──注入 math HTML──→ [HTML+math HTML]
 *   ──Tiptap 解析──→ [渲染内容（math 节点由 Tiptap 管理）]
 *
 *   [渲染内容] ──getHTML()──→ [HTML+math HTML] ──turndown──→ [Markdown] ──saveToMdx()──→ [MDX 原文]
 *
 * 支持的 MDX 语法：
 * - 标准 Markdown：标题、列表、代码块、链接、图片、粗体斜体等
 * - 块级数学公式：$$...$$
 * - 行内数学公式：$...$
 * - JSX 标签：<FadeIn>, <SlideIn>, <Callout>, <Steps>, <Image>, <CodeBlock>,
 *            <Excalidraw>, <SheetMusic>, <AnimatedSection>, <AnimatedList>,
 *            <ScaleIn>, <RotateIn>, <BounceIn>, <ConfettiOnView> 等
 */

import MarkdownIt from 'markdown-it'

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
 * 将 MDX 内容转换为 Tiptap 可直接渲染的 HTML 格式
 *
 * 策略：
 * 1. 使用 markdown-it 将 MDX/Markdown 解析为 HTML（提取数学公式后再解析，避免破坏性处理）
 * 2. 将 MDX 特殊语法（数学公式、JSX 组件）替换为 Tiptap 可识别的 HTML
 * 3. 返回 HTML 字符串，Tiptap 会直接渲染（而非当作纯文本）
 *
 * @param mdxContent 原始 MDX 内容
 * @returns Tiptap 可直接渲染的 HTML 内容
 */
export function loadToEditor(mdxContent: string): BridgeResult {
  const mathBlocks: Match[] = []
  const mathInlines: Match[] = []
  const components: Match[] = []
  const codeBlocks: Match[] = []

  // 第一步：将 MDX 数学语法暂时替换为不可见的转义标记，
  // 避免 markdown-it 错误地解析它们
  const MATH_BLOCK_ESCAPE = '\u0002MATHBLOCK_ESCAPE\u0003'
  const MATH_INLINE_ESCAPE = '\u0002MATHINLINE_ESCAPE\u0003'

  let result = mdxContent

  // 临时移除 $$...$$ 块级公式，防止 markdown-it 处理
  result = result.replace(/\$\$[\s\S]+?\$\$/g, (match) => {
    const id = mathBlocks.length
    const encoded = toBase64(match)
    mathBlocks.push({ original: match, placeholder: makePlaceholder(MATH_BLOCK_PREFIX, id, encoded) })
    return `${MATH_BLOCK_ESCAPE}${id}:${encoded}${MATH_BLOCK_ESCAPE}`
  })

  // 临时移除 $...$ 行内公式，防止 markdown-it 处理
  result = result.replace(/(?<!\$)\$(?!\$)((?:[^\$\n]|\$(?!\$))+?)\$/g, (match) => {
    const id = mathInlines.length
    const encoded = toBase64(match)
    mathInlines.push({ original: match, placeholder: makePlaceholder(MATH_INLINE_PREFIX, id, encoded) })
    return `${MATH_INLINE_ESCAPE}${id}:${encoded}${MATH_INLINE_ESCAPE}`
  })

  // 第二步：将处理后的内容通过 markdown-it 转为 HTML
  // 目的：生成标准 HTML，让 Tiptap 直接渲染（如 <h1># 标题</h1>）
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (/* str, lang */) {
      return '' // 让 Tiptap CodeBlockLowlight 处理高亮
    },
  })

  let html = md.render(result)

  // 第三步：将 markdown-it 输出的 HTML 中的临时标记替换为 Tiptap 可识别的 math HTML
  // Tiptap Mathematics 扩展通过 parseHTML 识别：
  //   <div data-type="block-math" data-latex="...">...</div>
  //   <span data-type="inline-math" data-latex="...">...</span>
  // 注意：这里直接注入 math HTML，不再用占位符文本节点

  // 块级公式：注入 <div data-type="block-math" data-latex="...">
  html = html.replace(
    new RegExp(`${MATH_BLOCK_ESCAPE}(\\d+):([A-Za-z0-9+/=]+)${MATH_BLOCK_ESCAPE}`, 'g'),
    (_match, id, _encoded) => {
      const key = parseInt(id, 10)
      if (key < mathBlocks.length) {
        // 从原始内容解析出 LaTeX（去掉 $$...$$ 包装）
        const original = mathBlocks[key].original
        const latex = original.slice(2, -2).trim()
        return `<div data-type="block-math" data-latex="${latexEncode(latex)}"></div>`
      }
      return _match
    }
  )

  // 行内公式：注入 <span data-type="inline-math" data-latex="...">
  html = html.replace(
    new RegExp(`${MATH_INLINE_ESCAPE}(\\d+):([A-Za-z0-9+/=]+)${MATH_INLINE_ESCAPE}`, 'g'),
    (_match, id, _encoded) => {
      const key = parseInt(id, 10)
      if (key < mathInlines.length) {
        // 从原始内容解析出 LaTeX（去掉 $...$ 包装）
        const original = mathInlines[key].original
        const latex = original.slice(1, -1).trim()
        return `<span data-type="inline-math" data-latex="${latexEncode(latex)}"></span>`
      }
      return _match
    }
  )

  // 第四步：处理 JSX 组件标签
  // 匹配自闭合标签：<ComponentName ... />
  html = html.replace(/<([A-Z][a-zA-Z]*)([^>]*?)\/>/g, (match, tagName) => {
    const commonHtmlTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'])
    if (commonHtmlTags.has(tagName.toLowerCase())) {
      return match
    }
    const id = components.length
    const encoded = toBase64(match)
    components.push({ original: match, placeholder: makePlaceholder(COMPONENT_PREFIX, id, encoded) })
    return components[id].placeholder
  })

  // 匹配带子元素的 JSX 组件标签：<ComponentName ...>...</ComponentName>
  html = html.replace(/<([A-Z][a-zA-Z]*)([^>]*?)>([\s\S]*?)<\/\1>/g, (match, tagName) => {
    const commonHtmlTags = new Set(['div', 'span', 'p', 'section', 'article', 'main', 'header', 'footer', 'aside', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'a', 'button', 'form', 'input', 'select', 'textarea'])
    if (commonHtmlTags.has(tagName.toLowerCase())) {
      return match
    }
    const id = components.length
    const encoded = toBase64(match)
    components.push({ original: match, placeholder: makePlaceholder(COMPONENT_PREFIX, id, encoded) })
    return components[id].placeholder
  })

  return {
    content: html,
    mathBlockCount: mathBlocks.length,
    mathInlineCount: mathInlines.length,
    componentCount: components.length,
    codeBlockCount: codeBlocks.length,
  }
}

/**
 * HTML 属性值转义（防止属性值中的引号破坏 HTML 结构）
 */
function latexEncode(latex: string): string {
  return latex
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * HTML 实体解码（还原 data-latex 属性值中的 &amp; &quot; &lt; &gt;）
 */
function latexDecodeHtmlEntities(encoded: string): string {
  return encoded
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/**
 * 将 Tiptap → turndown → Markdown 的内容还原为 MDX 格式
 *
 * @param markdownContent turndown 输出的 Markdown 内容
 * @param originalMdxContent 原始 MDX 内容（用于还原占位符）
 * @returns MDX 格式内容
 */
export function saveToMdx(markdownContent: string, originalMdxContent: string): RestoreResult {
  // 第一步：处理 Markdown 转义字符
  // turndown 在转换时会对 Markdown 特殊字符进行转义：
  //   \\*  → * (原本的星号)
  //   \\_  → _ (原本的下划线)
  //   \\.  → . (原本的点号，防止被当作列表标记)
  //   \\-  → - (原本的连字符)
  //   \\`  → ` (原本的反引号)
  //   \\\\  → \\ (原本的反斜杠)
  // 我们需要把它们还原回来
  let restoredContent = markdownContent
    .replace(/\\\\([*_`~[\]()#>+=|\\])/g, '$1')

  // 第二步：从 markdownContent 中提取 math HTML 节点中的 LaTeX
  // 这是关键：Tiptap getHTML() 输出的是数学公式的 HTML 表示，
  // 而不是占位符。我们需要用这些 LaTeX 值从 originalMdxContent 中找回对应占位符
  type MathPlaceholder = { latex: string; placeholder: string; original: string }
  const mathBlockPlaceholders: MathPlaceholder[] = []
  const mathInlinePlaceholders: MathPlaceholder[] = []

  // 从 originalMdxContent 中提取所有数学公式占位符
  // eslint-disable-next-line no-control-regex
  const placeholderRegex = /\u0002([A-Z]+)\u0003(\d+):(.+?)\u0003/g
  let phMatch: RegExpExecArray | null
  while ((phMatch = placeholderRegex.exec(originalMdxContent)) !== null) {
    const type = phMatch[1]
    const encoded = phMatch[3]

    if (type === 'MATHBLOCK' || type === 'MATHINLINE') {
      // 占位符中存储的是完整的原始 MDX 片段（Base64 编码）
      // 例如：$$\nx^2\n$$ 或 $E=mc^2$
      let decoded: string
      try {
        decoded = fromBase64(encoded)
      } catch {
        continue
      }

      // 提取 LaTeX 核心（去掉 $$ 或 $ 包装）
      let latex: string
      if (decoded.startsWith('$$')) {
        latex = decoded.slice(2, -2).trim()
        mathBlockPlaceholders.push({ latex, placeholder: phMatch[0], original: decoded })
      } else if (decoded.startsWith('$')) {
        latex = decoded.slice(1, -1).trim()
        mathInlinePlaceholders.push({ latex, placeholder: phMatch[0], original: decoded })
      }
    }
  }

  // 第三步：从 markdownContent 中提取 math HTML 节点，并用 LaTeX 值匹配占位符
  // 处理块级公式：<div data-type="block-math" data-latex="...">...</div>
  // 重要：使用 [\s\S]*?（0+字符，非贪婪）而非 [\s\S]+?（1+字符，非贪婪）
  // 因为空的 math div（如 KaTeX 渲染后的占位容器）在 > 和 < 之间有 0 个字符
  restoredContent = restoredContent.replace(
    /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
    (_fullMatch, latexAttr) => {
      const latex = latexDecodeHtmlEntities(latexAttr)
      // 通过 LaTeX 值匹配占位符
      const match = mathBlockPlaceholders.find(ph => ph.latex === latex)
      if (match) {
        return match.placeholder
      }
      // 如果找不到对应占位符（极少数情况），使用 LaTeX 构造 $$...$$
      return `\n$$\n${latex}\n$$\n`
    }
  )

  // 处理行内公式：<span data-type="inline-math" data-latex="...">...</span>
  // 同样使用 [\s\S]*? 以支持空的 math span
  restoredContent = restoredContent.replace(
    /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g,
    (_fullMatch, latexAttr) => {
      const latex = latexDecodeHtmlEntities(latexAttr)
      const match = mathInlinePlaceholders.find(ph => ph.latex === latex)
      if (match) {
        return match.placeholder
      }
      return `$${latex}$`
    }
  )

  // 第四步：处理非 HTML 形式的数学公式（占位符已在 markdownContent 中）
  // eslint-disable-next-line no-control-regex
  const extractRegex = /\u0002([A-Z]+)\u0003(\d+):(.+?)\u0003/g
  const placeholderMap = new Map<string, string>()
  let m: RegExpExecArray | null

  while ((m = extractRegex.exec(restoredContent)) !== null) {
    const type = m[1]
    const id = parseInt(m[2], 10)
    const encoded = m[3]
    const decoded = fromBase64(encoded)
    placeholderMap.set(`${type}${id}`, decoded)
  }

  // 如果 markdownContent 中没有占位符（不应该发生），尝试从 originalMdxContent 提取
  if (placeholderMap.size === 0) {
    // eslint-disable-next-line no-control-regex
    const fallbackRegex = /\u0002([A-Z]+)\u0003(\d+):(.+?)\u0003/g
    while ((m = fallbackRegex.exec(originalMdxContent)) !== null) {
      const type = m[1]
      const id = parseInt(m[2], 10)
      const encoded = m[3]
      const decoded = fromBase64(encoded)
      placeholderMap.set(`${type}${id}`, decoded)
    }
  }

  // 还原：扫描 restoredContent，将占位符替换为原始内容
  let restored = 0
  // eslint-disable-next-line no-control-regex
  const restoreRegex = /\u0002([A-Z]+)\u0003(\d+):(.+?)\u0003/g
  const afterPlaceholderRestore = restoredContent.replace(
    restoreRegex,
    (_fullMatch, type, idStr, _encoded) => {
      const key = `${type}${parseInt(idStr, 10)}`
      const original = placeholderMap.get(key)
      if (original !== undefined) {
        restored++
        return original
      }
      return _fullMatch
    }
  )

  // 第五步：修正 turndown 的 Markdown 输出格式
  // turndown 使用 setext 风格渲染 HTML 标题（标题\n=====\n），
  // 需要转回 ATX 风格（# 标题）
  const finalResult = afterPlaceholderRestore
    // h1 setext → ATX: 标题\n========\n → # 标题
    .replace(/^(.+)\n={3,}\n/gm, (_match, text) => `# ${text}\n`)
    // h2 setext → ATX: 标题\n-------\n → ## 标题
    .replace(/^(.+)\n-{3,}\n/gm, (_match, text) => `## ${text}\n`)

  // 第六步：修正粗体/斜体标记
  // turndown 默认使用 _ 而非 *，需要统一为 *（与原始 MDX 一致）
    .replace(/_(.+?)_/g, '*$1*')

  return { content: finalResult, restored }
}

/**
 * 专门用于还原数学公式（供 TiptapEditor 的 turndown 转换后调用）
 */
export function restoreMathFormulas(markdownAfterTurndown: string, originalMdxContent: string): string {
  return saveToMdx(markdownAfterTurndown, originalMdxContent).content
}

// ==================== 开发调试 ====================

/**
 * 验证转换的往返一致性
 */
export function roundtripTest(mdxContent: string): {
  success: boolean
  original: string
  afterRoundtrip: string
  diff: string[]
} {
  const { content: editorContent } = loadToEditor(mdxContent)
  const { content: restored } = saveToMdx(editorContent, mdxContent)

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  const success = normalize(restored) === normalize(mdxContent)

  const diff: string[] = []
  if (!success) {
    diff.push(`原始长度: ${mdxContent.length}`)
    diff.push(`还原后长度: ${restored.length}`)
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
