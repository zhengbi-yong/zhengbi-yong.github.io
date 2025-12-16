/**
 * Rehype plugin to process mhchem \ce commands before KaTeX rendering
 * This plugin converts \ce{...} to LaTeX code using mhchemparser
 */
import { visit } from 'unist-util-visit'
import type { Root } from 'hast'
import { mhchemParser } from 'mhchemparser'

export default function rehypeMhchem() {
  return (tree: Root) => {
    visit(tree, 'element', (node: any) => {
      // 查找包含数学公式的节点（remark-math生成的节点）
      const classes = Array.isArray(node.properties?.className) ? node.properties.className : []
      const isMathNode = classes.includes('math-display') || classes.includes('math-inline')

      if (isMathNode && node.children) {
        // 处理数学节点中的所有文本节点
        const processNode = (n: any): void => {
          if (n.type === 'text' && n.value && typeof n.value === 'string') {
            // 查找并替换 \ce{...} 命令
            n.value = n.value.replace(/\\ce\{([^}]+)\}/g, (match: string, content: string) => {
              try {
                // 使用mhchemparser转换
                let tex = mhchemParser.toTex(content, 'ce')
                // 替换KaTeX不支持的LaTeX命令
                // \longrightleftharpoons -> \rightleftharpoons (KaTeX不支持long版本)
                tex = tex.replace(/\\longrightleftharpoons/g, '\\rightleftharpoons')
                // 其他可能的替换...
                return tex
              } catch (e) {
                // 如果转换失败，返回原始内容
                console.warn('Failed to parse mhchem:', content, e)
                return match
              }
            })
          }
          if (n.children && Array.isArray(n.children)) {
            n.children.forEach(processNode)
          }
        }

        node.children.forEach(processNode)
      }
    })
  }
}
