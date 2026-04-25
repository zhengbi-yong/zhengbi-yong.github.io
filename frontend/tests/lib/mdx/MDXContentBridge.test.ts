/**
 * MDXContentBridge 数学公式往返测试
 *
 * 测试数学公式在 MDX → Tiptap 编辑器 → 保存 → MDX 往返过程中的完整性
 * 关键修复：使用 [\s\S]* 而非 [\s\S]+，因为空的 math div 在 > 和 < 之间有 0 个字符
 */

import { describe, it, expect } from 'vitest'
import TurndownService from 'turndown'
import { loadToEditor, saveToMdx } from '@/lib/mdx/MDXContentBridge'

function latexDecodeHtmlEntities(encoded: string): string {
  return encoded
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

describe('MDXContentBridge 数学公式往返', () => {
  describe('正则替换逻辑', () => {
    it('应正确处理空的块级公式 div（0 字符内容）', () => {
      const html = '<div data-type="block-math" data-latex="x^2"></div>'
      const processed = html.replace(
        /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
        (_m, l) => `\n$$\n${l}\n$$\n`
      )
      expect(processed).toContain('$$')
      expect(processed).toContain('x^2')
    })

    it('应正确处理带 KaTeX 子元素的块级公式 div', () => {
      const html = '<div data-type="block-math" data-latex="a^2"><span class="katex">...</span></div>'
      const processed = html.replace(
        /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
        (_m, l) => `\n$$\n${l}\n$$\n`
      )
      expect(processed).toContain('$$')
      expect(processed).toContain('a^2')
    })

    it('应正确处理空的内联公式 span', () => {
      const html = '<span data-type="inline-math" data-latex="E=mc^2"></span>'
      const processed = html.replace(
        /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/span>/g,
        (_m, l) => `$${l}$`
      )
      expect(processed).toBe('$E=mc^2$')
    })

    it('应正确处理带 KaTeX 子元素的内联公式 span', () => {
      const html = '<span data-type="inline-math" data-latex="x^2"><span class="katex"><span class="mord">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.664392em;"><span class=""></span><span class="baseline-sym">2</span></span></span></span></span></span></span>'
      const processed = html.replace(
        /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/span>/g,
        (_m, l) => `$${latexDecodeHtmlEntities(l)}$`
      )
      expect(processed).toBe('$x^2$')
    })

    it('应正确还原复杂矩阵公式', () => {
      const latex = '\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}'
      const html = `<div data-type="block-math" data-latex="${latex}"></div>`
      const processed = html.replace(
        /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
        (_m, l) => `\n$$\n${latexDecodeHtmlEntities(l)}\n$$\n`
      )
      expect(processed).toContain('begin{bmatrix}')
      expect(processed).toContain('\\\\')
    })
  })

  describe('Turndown 集成', () => {
    const td = new TurndownService({ collapseWhitespace: false })

    it('块级公式应通过 turndown 保留 LaTeX 内容', () => {
      const processed = '\n$$\nx^2 + y^2 = z^2\n$$\n'
      const markdown = td.turndown(processed)
      expect(markdown).toContain('x^2')
      expect(markdown).toContain('z^2')
    })

    it('行内公式应通过 turndown 保留 $...$ 格式', () => {
      const processed = '<p>质能等价公式 $E=mc^2$ 是的</p>'
      const markdown = td.turndown(processed)
      expect(markdown).toContain('$E=mc^2$')
    })
  })

  describe('完整往返流程', () => {
    it('块级公式往返：HTML → 正则提取 → turndown → MDX', () => {
      const loadedHtml = '<div data-type="block-math" data-latex="x^2 + y^2 = z^2"></div>'
      const processed = loadedHtml.replace(
        /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
        (_m, l) => `\n$$\n${latexDecodeHtmlEntities(l)}\n$$\n`
      )
      const td = new TurndownService({ collapseWhitespace: false })
      const markdown = td.turndown(processed)
      expect(markdown).toContain('x^2')
      expect(markdown).toContain('z^2')
    })

    it('行内公式往返', () => {
      const loadedHtml = '<span data-type="inline-math" data-latex="E=mc^2"></span>'
      const processed = loadedHtml.replace(
        /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/span>/g,
        (_m, l) => `$${latexDecodeHtmlEntities(l)}$`
      )
      const td = new TurndownService({ collapseWhitespace: false })
      const markdown = td.turndown(`<p>质能等价公式 ${processed} 是的</p>`)
      expect(markdown).toContain('$E=mc^2$')
    })

    it('应正确完成块级公式的 loadToEditor → saveToMdx 往返', () => {
      // 模拟 MDX 内容
      const mdxContent = '$$\na^2 + b^2 = c^2\n$$'

      // 步骤 1：loadToEditor（MDX → 编辑器 HTML）
      const { content: editorHtml } = loadToEditor(mdxContent)

      // 验证编辑器 HTML 包含正确的 math 标签
      expect(editorHtml).toContain('data-type="block-math"')
      expect(editorHtml).toContain('a^2')

      // 步骤 2：模拟 TiptapEditor.onUpdate（提取 data-latex → markdown）
      const td = new TurndownService({ collapseWhitespace: false })
      let processed = editorHtml
        .replace(
          /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
          (_m, l) => `\n$$\n${latexDecodeHtmlEntities(l)}\n$$\n`
        )
      const markdown = td.turndown(processed)

      // 步骤 3：saveToMdx（markdown → MDX）
      const { content: savedMdx } = saveToMdx(markdown, mdxContent)

      // 步骤 4：验证往返成功（忽略空白差异）
      const normalizedOrig = mdxContent.replace(/\s+/g, ' ').trim()
      const normalizedSaved = savedMdx.replace(/\s+/g, ' ').trim()
      expect(normalizedSaved).toBe(normalizedOrig)
    })

    it('应正确完成行内公式的 loadToEditor → saveToMdx 往返', () => {
      const mdxContent = 'The formula $E=mc^2$ is famous.'

      const { content: editorHtml } = loadToEditor(mdxContent)
      expect(editorHtml).toContain('data-type="inline-math"')
      expect(editorHtml).toContain('E=mc^2')

      const td = new TurndownService({ collapseWhitespace: false })
      let processed = editorHtml
        .replace(
          /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g,
          (_m, l) => `$${latexDecodeHtmlEntities(l)}$`
        )
      const markdown = td.turndown(processed)
      const { content: savedMdx } = saveToMdx(markdown, mdxContent)

      // 行内公式往返：$E=mc^2$ 应被保留
      expect(savedMdx).toContain('$E=mc^2$')
    })

    it('混合内容往返：块级 + 行内 + 文本', () => {
      const loadedHtml = `<p>这是一个段落。</p>
<div data-type="block-math" data-latex="a^2 + b^2 = c^2"></div>
<p>这是另一个段落，包含行内公式 <span data-type="inline-math" data-latex="x"></span> 和更多文本。</p>`

      let processed = loadedHtml
        .replace(
          /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
          (_m, l) => `\n$$\n${latexDecodeHtmlEntities(l)}\n$$\n`
        )
        .replace(
          /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/span>/g,
          (_m, l) => `$${latexDecodeHtmlEntities(l)}$`
        )

      const td = new TurndownService({ collapseWhitespace: false })
      const markdown = td.turndown(processed)

      // 关键验证：LaTeX 内容被保留
      expect(markdown).toContain('a^2')
      expect(markdown).toContain('c^2')
      expect(markdown).toContain('$x$')
    })
  })
})
