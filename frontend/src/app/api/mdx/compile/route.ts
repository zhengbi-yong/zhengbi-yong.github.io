import { NextRequest, NextResponse } from 'next/server'
import { serialize } from 'next-mdx-remote/serialize'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
// @shikijs/rehype processes code fences as Shiki HTML BEFORE JSX compilation,
// producing className="shiki shiki-themes github-light github-dark" in the
// compiled source — no brace-counting post-processing needed.
import rehypeShiki from '@shikijs/rehype'

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { source } = await request.json()

    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: 'source is required and must be a string' },
        { status: 400 }
      )
    }

    // Serialize with Shiki as a rehype plugin — runs at the MDAST→HAST→MDX
    // compilation stage, so _jsxDEV calls receive pre-highlighted HTML strings.
    const serialized = await serialize(source, {
      mdxOptions: {
        remarkPlugins: [remarkMath, remarkGfm],
        rehypePlugins: [
          rehypeKatex,
          [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' } }],
        ],
      },
    })

    return NextResponse.json({
      compiledSource: serialized.compiledSource,
      frontmatter: serialized.frontmatter ?? {},
    })
  } catch (error) {
    console.error('MDX compile error:', error)
    return NextResponse.json(
      { error: 'MDX compilation failed', details: String(error) },
      { status: 500 }
    )
  }
}
