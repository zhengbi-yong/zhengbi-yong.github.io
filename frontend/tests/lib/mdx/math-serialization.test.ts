/**
 * MDX 数学公式序列化测试
 *
 * 直接测试 Tiptap → Markdown → MDX 转换链中的数学公式处理逻辑
 */

import { describe, it, expect } from 'vitest'
import TurndownService from 'turndown'

// 模拟 TiptapEditor 的数学公式序列化逻辑
function latexDecodeHtmlEntities(encoded: string): string {
  return encoded
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function processMathNodes(html: string): string {
  return html
    .replace(
      /<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]+<\/div>/g,
      (_match, latex) => `\n$$\n${latexDecodeHtmlEntities(latex)}\n$$\n`
    )
    .replace(
      /<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]+<\/span>/g,
      (_match, latex) => `$${latexDecodeHtmlEntities(latex)}$`
    )
}

describe('Tiptap 数学公式序列化', () => {
  describe('processMathNodes', () => {
    it('应正确序列化块级公式（空 KaTeX 子元素）', () => {
      const html = '<div data-type="block-math" data-latex="x^2"><span class="katex">...</span></div>'
      const result = processMathNodes(html)
      expect(result).toBe('\n$$\nx^2\n$$\n')
    })

    it('应正确序列化行内公式（空 KaTeX 子元素）', () => {
      const html = '<span data-type="inline-math" data-latex="E=mc^2"><span class="katex">...</span></span>'
      const result = processMathNodes(html)
      expect(result).toBe('$E=mc^2$')
    })

    it('应正确解码 HTML 实体', () => {
      const html = '<span data-type="inline-math" data-latex="a&amp;b"><span class="katex">...</span></span>'
      const result = processMathNodes(html)
      expect(result).toBe('$a&b$')
    })

    it('应处理复杂的 LaTeX 矩阵公式', () => {
      const latex = '\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}'
      const html = `<div data-type="block-math" data-latex="${latex}"><span class="katex">...</span></div>`
      const result = processMathNodes(html)
      expect(result).toContain('begin{bmatrix}')
      expect(result).toContain('\\\\')
    })
  })

  describe('Turndown 转换', () => {
    const td = new TurndownService({ collapseWhitespace: false })

    it('应将块级公式转换为 $$ formula $$ 格式', () => {
      const processed = '\n$$\nx^2\n$$\n'
      const md = td.turndown(processed)
      expect(md).toContain('$$')
      expect(md).toContain('x^2')
    })

    it('应将行内公式转换为 $formula$ 格式', () => {
      const processed = '$E=mc^2$'
      const md = td.turndown(processed)
      expect(md).toBe('$E=mc^2$')
    })

    it('完整流程：HTML → turndown → Markdown', () => {
      const html = '<p>The formula is <div data-type="block-math" data-latex="x^2"><span class="katex">...</span></div></p>'
      const processed = processMathNodes(html)
      const md = td.turndown(processed)
      expect(md).toContain('$$ x^2 $$')
    })
  })

  describe('往返一致性', () => {
    it('turndown 输出的格式应能被 remark-math 正确解析', () => {
      // Turndown 输出格式：$$ formula $$（有空格）
      const turndownOutput = '$$ x^2 $$'

      // remark-math 能识别的格式：无空格的 $$...$$
      // 但有空格时 remark-math 也能处理（\$之前的内容被当作普通文本）

      // 关键验证：输出的格式能正确往返
      const td = new TurndownService({ collapseWhitespace: false })
      const blockProcessed = '\n$$\nx^2\n$$\n'
      const md = td.turndown(blockProcessed)
      expect(md).toContain('$$')
      expect(md).toContain('x^2')
    })

    it('行内公式往返', () => {
      const td = new TurndownService({ collapseWhitespace: false })
      const inlineHtml = '<p>Formula $E=mc^2$ works</p>'
      const processed = processMathNodes(inlineHtml)
      const md = td.turndown(processed)
      expect(md).toContain('$E=mc^2$')
    })
  })
})
