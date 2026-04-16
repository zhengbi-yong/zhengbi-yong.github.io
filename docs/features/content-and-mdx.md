# Content and MDX

## Purpose

The content system serves static authored content and dynamic runtime-rendered MDX through one shared component table.

## User-facing capabilities

- blog post publishing with Contentlayer-backed MDX content
- shared MDX rendering for static pages and runtime content
- rich embeds including ABC notation, Excalidraw, charts, chemistry components, and animations
- author pages and blog index pages powered by the same content graph

## Core implementation

### Static MDX path

- source content lives under [frontend/data/blog](../../../../../frontend/data/blog)
- static pages such as [about/page.tsx](../../../../../frontend/src/app/about/page.tsx#L1) render Contentlayer output with `MDXLayoutRenderer`

### Shared component registry

- [MDXComponents.tsx](../../../../../frontend/src/components/MDXComponents.tsx#L1) is the single MDX component source
- it handles fenced `abc` blocks, custom embeds, and dynamically imported heavy widgets
- the registry is reused by both static and runtime MDX rendering paths

### ABC notation

- [SheetMusic.tsx](../../../../../frontend/src/components/SheetMusic.tsx) renders notation and playback controls via `abcjs`
- the `pre` handler in [MDXComponents.tsx](../../../../../frontend/src/components/MDXComponents.tsx#L1) upgrades fenced `abc` blocks into music notation
- [test-abc-mdx/page.tsx](../../../../../frontend/src/app/test-abc-mdx/page.tsx) exercises the real Contentlayer render path

### Excalidraw and advanced embeds

- [ExcalidrawEmbed.tsx](../../../../../frontend/src/components/MDXComponents/ExcalidrawEmbed.tsx) is a client-only MDX embed
- chart, chemistry, and animation blocks are lazy-loaded from the same registry to limit initial bundle cost

## Runtime dependencies

- Next.js App Router
- Contentlayer / Pliny MDX renderer
- `abcjs` for ABC notation
- dynamically imported client bundles for charts, chemistry, and Excalidraw

## Scaling properties

- static MDX content scales well behind CDN caching because rendering happens at build time
- runtime MDX stays maintainable because the component surface is centralized
- heavy client widgets are isolated behind dynamic import boundaries

## Known boundaries

- MDX component typing is still loose in several places and uses `any`
- the MDX registry is large and could eventually benefit from language/feature-specific sub-registries
- there are test pages in the app tree that should remain clearly separated from production content
