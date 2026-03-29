# Phase 1: Art-Level Blog Reading Experience — Design Spec

> **Status**: Approved for implementation
> **Date**: 2026-03-29
> **Depends on**: v2.0.0 release (completed)
> **Constraint**: All existing features must remain functional throughout implementation.

## Goal

Transform the blog article reading experience from a functional blog layout into a world-class, art-level reading interface inspired by Distill.pub, Stripe Engineering, and Quanta Magazine. The layout will follow golden-ratio proportions, feature a sticky scroll-spy TOC, refined typography, and polished micro-interactions.

## Scope

**In scope**:
- Article detail page layout redesign (asymmetric two-column)
- Typography system overhaul (bilingual CJK/Latin)
- Code block visual upgrade (app-style cards)
- Table responsive redesign
- Reading progress bar
- Sticky TOC with scroll-spy
- Micro-interactions and animations
- Comment side-drawer

**Out of scope** (future phases):
- Homepage redesign
- Blog listing page redesign
- Admin panel redesign
- Multi-user / UGC features
- Backend architecture changes
- Search engine / i18n overhaul

## Architecture

### Layout System

**Golden-ratio asymmetric two-column layout** for article detail pages:

```
Desktop (>= 1280px):
┌───────────────────────────────────────────────────────┐
│  Progress Bar (2px, fixed top, brand gradient)         │
├───────────────────────────────────────────────────────┤
│                    Article Hero                         │
│  Title | Date | Tags | Reading Time                    │
├──────────────────────────────────┬────────────────────┤
│                                 │                     │
│    Main Content (62%)           │   TOC Sidebar (38%) │
│    max-width: 680px             │   max-width: 320px  │
│    optimal line length:         │   position: sticky  │
│    65-75 chars/line             │   top: 2rem         │
│                                 │   scroll-spy active │
│                                 │                     │
├──────────────────────────────────┴────────────────────┤
│              Recommended Articles / Author Bio          │
└───────────────────────────────────────────────────────┘

Tablet (768-1279px):
- Content full-width with TOC collapsed to floating button
- TOC opens as dropdown overlay on click

Mobile (< 768px):
- Single column layout
- TOC as floating FAB button (bottom-right)
- Progress bar becomes thin 2px line at top
```

**TOC Component** (`TableOfContents`):
- Built with `IntersectionObserver` API for scroll-spy
- Active section highlighted with brand color left-border
- Smooth scroll on click via `scroll-behavior: smooth`
- Collapses on mobile to floating button with dropdown

**Progress Bar** (`ReadingProgressBar`):
- Fixed position at viewport top, `z-index: 50`
- Height: 2px, brand gradient background
- Width calculated from `scrollY / (scrollHeight - clientHeight)`
- Uses `requestAnimationFrame` for smooth updates
- Hidden on homepage and listing pages (only on `/blog/[slug]` routes)

### Typography System

**Font Stack**:
```css
/* UI Text (English-first) */
--font-sans: 'Inter', 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;

/* Code */
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

/* Article Body - higher x-height for readability */
--font-body: 'Inter', 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
```

**Font Loading**: Use `next/font/google` for Inter and JetBrains Mono with `display: swap` to avoid FOIT.

**Sizing Scale** (Fibonacci-based):
| Element | Size | Leading | Tracking |
|---------|------|---------|----------|
| h1 | 2.25rem (36px) | 1.3 | -0.02em |
| h2 | 1.75rem (28px) | 1.35 | -0.01em |
| h3 | 1.375rem (22px) | 1.4 | 0 |
| h4 | 1.125rem (18px) | 1.45 | 0 |
| Body | 1rem (16px) | 1.75 (CJK) / 1.6 (Latin) | 0 |
| Small | 0.875rem (14px) | 1.5 | 0.01em |
| Caption | 0.75rem (12px) | 1.5 | 0.02em |

**CJK-specific adjustments**:
- Body line-height: 1.75 (vs 1.6 for Latin) — CJK characters lack word-spacing, need more vertical breathing room
- Paragraph spacing: `1.5em` between paragraphs (vs `1em` for Latin-only)
- CJK detection: use `:lang(zh)` or CSS `unicode-range` where possible; fallback to a `.cjk-content` class on the article wrapper

**Content width constraint**:
- Max content width: 680px (approximately 65-75 characters per line)
- Centered within the available main column space
- Margins auto-calculated by the grid system

### Code Block Design

**Visual style**: App-style card with macOS window chrome.

```tsx
// Component: CodeBlock (replaces current syntax highlighting)
<div className="code-block rounded-lg overflow-hidden my-6">
  {/* Title bar */}
  <div className="code-block-header flex items-center justify-between
                  bg-zinc-900 dark:bg-zinc-950 px-4 py-2">
    <div className="flex items-center gap-2">
      {/* macOS dots */}
      <span className="w-3 h-3 rounded-full bg-red-500" />
      <span className="w-3 h-3 rounded-full bg-yellow-500" />
      <span className="w-3 h-3 rounded-full bg-green-500" />
      {/* Language label */}
      <span className="text-xs text-zinc-400 ml-2">{language}</span>
    </div>
    <CopyButton text={code} />
  </div>
  {/* Code content - always dark theme */}
  <div className="code-block-body bg-[#1e1e2e] dark:bg-[#0d0d14]
                  p-4 overflow-x-auto text-sm leading-relaxed">
    <pre><code>{/* highlighted code */}</code></pre>
  </div>
</div>
```

**Copy button behavior**:
- Default: clipboard icon
- On click: checkmark icon + "Copied!" tooltip, reverts after 2s
- Smooth icon transition via CSS `transition: opacity 150ms`

**Code always uses dark theme** even in light mode — creates visual anchor points in long articles, reduces eye strain.

### Table Design

**Desktop** (>= 768px):
- Clean horizontal lines only (no full borders)
- Alternating row tinting (subtle `bg-muted/50`)
- Header row with `font-weight: 600` and bottom border
- Hover: row highlight with `bg-muted`

**Mobile** (< 768px): Card collapse pattern.
```css
@media (max-width: 767px) {
  .prose table { display: block; }
  .prose thead { display: none; }
  .prose tbody { display: block; }
  .prose tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem;
  }
  .prose td {
    display: block;
    text-align: right;
    padding: 0.25rem 0;
  }
  .prose td::before {
    content: attr(data-label);
    float: left;
    font-weight: 600;
    margin-right: 1rem;
  }
}
```

The `data-label` attributes are injected by the existing `TableWrapper` component using the `<th>` text from the first table row.

### Micro-interactions

**Timing**: All animations 150-250ms, using `cubic-bezier(0.4, 0, 0.2, 1)` (Material ease-out).

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Article cards (listing) | hover | `translateY(-2px)` + shadow expand | 200ms |
| TOC active indicator | scroll | Left-border slide to new position | 200ms |
| Progress bar | scroll | Width transition (GPU-composited) | 100ms |
| Copy button | click | Icon swap + tooltip appear | 150ms |
| Comment drawer | click | Slide from right `translateX(100% → 0)` | 250ms |
| Code block copy | click | Checkmark + tooltip | 150ms |
| Dark mode toggle | click | CSS variable transition on `background-color`, `color` | 200ms |

All transforms use `will-change: transform` sparingly and `transform: translateZ(0)` for GPU compositing.

### Comment Side-Drawer

**Trigger**: Floating action button (FAB) at bottom-right of article, showing comment count badge.

**Drawer**:
- Slides from right edge, width: 400px desktop, 100% mobile
- Semi-transparent backdrop on mobile
- Non-modal: article content remains visible and scrollable
- Close: click backdrop, press Escape, or click close button

**Integration**: Uses existing Giscus configuration. The drawer component wraps the existing `Comments` component.

### Reading Progress Bar

- Fixed at viewport top: `position: fixed; top: 0; left: 0; z-index: 50;`
- Height: 2px
- Background: brand gradient (left to right)
- Only rendered on article detail pages (`/blog/[slug]`)
- Hidden when scrolled to top (progress = 0)
- Uses scroll event with `requestAnimationFrame` throttling for 60fps updates

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/components/layouts/PostLayout.tsx` | Major modify | Restructure to asymmetric two-column layout |
| `frontend/src/components/layouts/postLayoutContent.ts` | Major modify | Extract TOC, progress bar, restructure content flow |
| `frontend/src/components/TableWrapper.tsx` | Modify | Add responsive card collapse + data-label injection |
| `frontend/src/components/Comments.tsx` | Minor modify | Wrap in drawer component |
| `frontend/src/styles/tailwind.css` | Major modify | Typography scale, code block styles, table styles, animations |
| `frontend/src/app/globals.css` | Minor modify | Font imports |
| `frontend/tailwind.config.ts` | Modify | Add custom fonts, spacing scale, animation keyframes |
| New: `frontend/src/components/ReadingProgressBar.tsx` | Create | Progress bar component |
| New: `frontend/src/components/TableOfContents.tsx` | Create | Sticky TOC with scroll-spy |
| New: `frontend/src/components/CodeBlock.tsx` | Create | App-style code block with copy button |
| New: `frontend/src/components/CommentDrawer.tsx` | Create | Side-drawer wrapper for comments |
| New: `frontend/src/components/ui/FAB.tsx` | Create | Floating action button for comment trigger |

## Implementation Order

The implementation must be **incremental** — each step keeps the site fully functional:

1. **Typography foundation** — CSS variables, font loading, spacing scale. No layout changes.
2. **Table redesign** — Responsive card collapse. Same layout, better tables.
3. **Code block upgrade** — App-style cards. Same layout, better code blocks.
4. **TOC component** — New standalone component, not yet integrated.
5. **Progress bar component** — New standalone component, not yet integrated.
6. **Article layout restructure** — Wire TOC + progress bar into asymmetric layout.
7. **Comment drawer** — FAB + side drawer. Replace inline comments.
8. **Micro-interactions pass** — Hover effects, transitions, polish.

## Testing Criteria

Each step must pass:
- `pnpm build` succeeds without errors
- Article pages render correctly at desktop (1280px), tablet (768px), mobile (375px)
- Existing MDX components (chemistry, music, math) continue to work
- Dark/light mode toggle works
- No hydration errors in console
- All navigation (header, search, auth) remains functional
- Admin panel untouched and functional

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Font loading causes CLS | Use `next/font` with `display: swap` + size-adjust CSS |
| TOC scroll-spy performance | Use `IntersectionObserver` (not scroll events), debounce at 100ms |
| Layout shift on article pages | Wrap changes in feature flag (`feature-flags.ts`), enable per-route |
| Mobile card table needs data-label | Fallback: show header row on mobile if JS fails |
| Code block always-dark conflicts with theme | Scope dark styles to `.code-block-body` only, not global |
