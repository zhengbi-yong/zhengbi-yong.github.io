// Test: can @shikijs/rehype work as a plugin with next-mdx-remote/serialize?
import { serialize } from 'next-mdx-remote/serialize'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'

const testSource = `---
title: Test
---

# Hello

This is \`inline\` code.

\`\`\`python
def hello():
    print("world")
\`\`\`

$$E = mc^2$$
`

async function main() {
  try {
    const result = await serialize(testSource, {
      mdxOptions: {
        remarkPlugins: [remarkMath, remarkGfm],
        rehypePlugins: [
          rehypeKatex,
          [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' } }],
        ],
      },
    })
    console.log('=== SUCCESS ===')
    console.log('compiledSource length:', result.compiledSource.length)
    // Check if shiki classes are present
    const hasShiki = result.compiledSource.includes('shiki')
    console.log('Has shiki in output:', hasShiki)
    if (hasShiki) {
      const idx = result.compiledSource.indexOf('shiki')
      console.log('Shiki context:', result.compiledSource.substring(Math.max(0, idx-50), idx+100))
    }
  } catch(err) {
    console.log('=== ERROR ===')
    console.log(String(err))
  }
}

main()
