---
title: Color Theme System
---

# Color Theme System

## Purpose

The color theme system allows users to switch between **32 curated color palettes** in real-time. Each theme overrides the accent/brand colors while preserving the light/dark mode foundation. Themes persist across sessions via `localStorage` and are applied instantly via CSS custom properties — no page reload required.

## User-facing capabilities

- 🎨 **Palette button** in the header (next to dark mode toggle) opens a theme selector popover
- **32 themes** organized by category: classic dev, brand-inspired, seasonal/mood, warm, cool, natural
- **Instant preview**: 5-color swatch per theme, click to apply
- **Persistence**: selected theme survives page refresh and browser restart
- **Zero layout shift**: only accent colors change — spacing, typography, and layout are unaffected

## Architecture

```
┌─────────────────────────────────────────────┐
│  User clicks 🎨 → ThemeSelector component   │
│       ↓                                      │
│  Zustand theme-store (themeId)               │
│       ↓ localStorage persistence             │
│  <html data-theme="ocean-teal">              │
│       ↓                                      │
│  CSS [data-theme="xxx"] { --theme-accent }   │
│       ↓                                      │
│  All components render via var(--theme-*)    │
└─────────────────────────────────────────────┘
```

### Three-layer CSS variable architecture

| Layer | File | Purpose |
|-------|------|---------|
| **Raw tokens** | `geist-tokens.css` | Vercel Geist design system values for light/dark |
| **Semantic tokens** | `tokens.css` | Unified names (`--theme-accent`, `--theme-bg`, …) |
| **Theme palettes** | `themes/*.css` | Override semantic tokens per named theme |

Components reference **only** semantic tokens (`var(--theme-accent)`), never raw hex values. This means adding a new theme requires zero component changes — only a new CSS file.

## File map

```
frontend/src/
├── styles/
│   ├── tokens.css                   ← Semantic layer (30+ tokens)
│   ├── geist-tokens.css             ← Default raw values (Geist design system)
│   ├── themes/
│   │   ├── index.css                ← @import all 32 theme files
│   │   ├── midnight-indigo.css      ← Default theme
│   │   ├── sunset-orange.css
│   │   ├── ocean-teal.css
│   │   ├── catppuccin-mocha.css
│   │   ├── tokyo-night.css
│   │   ├── gruvbox-dark.css
│   │   ├── … (32 total)
│   │   └── plum-noir.css
│   └── tailwind.css                 ← @import tokens + themes/index
├── lib/store/
│   └── theme-store.ts               ← Zustand store + theme definitions
├── components/theme/
│   ├── ThemeInitializer.tsx          ← Mounts in layout, syncs data-theme attr
│   └── ThemeSelector.tsx            ← Swatch grid UI component
└── app/
    └── layout.tsx                    ← Imports ThemeInitializer
```

## Semantic tokens reference

| Token | Purpose | Falls back to |
|-------|---------|---------------|
| `--theme-bg` | Main page background | `--geist-bg` |
| `--theme-bg-secondary` | Card/sidebar background | `--geist-bg-secondary` |
| `--theme-bg-tertiary` | Hover/active background | `--geist-bg-tertiary` |
| `--theme-fg` | Primary text | `--geist-fg` |
| `--theme-fg-secondary` | Secondary text | `--geist-fg-secondary` |
| `--theme-fg-tertiary` | Muted text | `--geist-fg-tertiary` |
| `--theme-fg-link` | Hyperlink color | `#3b82f6` |
| `--theme-accent` | **Brand/accent color** (theme-specific) | `#6366f1` |
| `--theme-accent-hover` | Accent hover state | `#818cf8` |
| `--theme-accent-muted` | Subtle accent background | `rgba(99,102,241,0.1)` |
| `--theme-accent-foreground` | Text on accent background | `#ffffff` |
| `--theme-border` | Default borders | `--geist-border` |
| `--theme-border-strong` | Emphasized borders | `--geist-border-strong` |
| `--theme-success` | Success green | `--geist-success` |
| `--theme-warning` | Warning amber | `--geist-warning` |
| `--theme-danger` | Danger/error red | `--geist-destructive` |
| `--theme-info` | Informational blue | `#3b82f6` |
| `--theme-muted` | Muted surface | `--geist-muted` |

## Complete theme catalog (32 themes)

| # | Theme ID | Name | Category |
|---|----------|------|----------|
| 1 | `midnight-indigo` | 午夜靛蓝 | Default |
| 2 | `sunset-orange` | 日落橙 | Warm |
| 3 | `ocean-teal` | 海洋青 | Cool |
| 4 | `rose-gold` | 玫瑰金 | Warm |
| 5 | `forest-emerald` | 森林翡翠 | Natural |
| 6 | `lavender-dream` | 薰衣草梦 | Mood |
| 7 | `github-dark` | GitHub 暗色 | Dev classic |
| 8 | `nord-frost` | Nord 冰霜 | Cool |
| 9 | `dracula-purple` | Dracula 紫 | Dev classic |
| 10 | `amber-warm` | 琥珀暖 | Warm |
| 11 | `cyber-neon` | 赛博霓虹 | Mood |
| 12 | `catppuccin-mocha` | Catppuccin Mocha | Dev classic |
| 13 | `catppuccin-latte` | Catppuccin Latte | Dev classic |
| 14 | `tokyo-night` | Tokyo Night | Dev classic |
| 15 | `gruvbox-dark` | Gruvbox Dark | Dev classic |
| 16 | `gruvbox-light` | Gruvbox Light | Dev classic |
| 17 | `solarized-dark` | Solarized Dark | Dev classic |
| 18 | `solarized-light` | Solarized Light | Dev classic |
| 19 | `monokai-pro` | Monokai Pro | Dev classic |
| 20 | `nord-aurora` | Nord Aurora | Cool |
| 21 | `everforest` | Everforest | Natural |
| 22 | `apple-slate` | Apple Slate | Brand |
| 23 | `stripe-blue` | Stripe Blue | Brand |
| 24 | `spotify-green` | Spotify Green | Brand |
| 25 | `discord-blurple` | Discord Blurple | Brand |
| 26 | `notion-light` | Notion Light | Brand |
| 27 | `linear-dark` | Linear Dark | Brand |
| 28 | `cherry-blossom` | Cherry Blossom | Seasonal |
| 29 | `matcha-latte` | Matcha Latte | Natural |
| 30 | `midnight-aurora` | Midnight Aurora | Cool |
| 31 | `terracotta-earth` | Terracotta Earth | Warm |
| 32 | `plum-noir` | Plum Noir | Mood |

## Adding a new theme

1. **Create the CSS file** at `frontend/src/styles/themes/<theme-id>.css`:

```css
/**
 * My New Theme
 *
 * Brief description of the palette and its inspiration.
 */

[data-theme="my-new-theme"] {
  --theme-accent: #yourAccent;
  --theme-accent-hover: #yourHover;
  --theme-accent-muted: rgba(r, g, b, 0.1);
  --theme-accent-foreground: #textOnAccent;
}

.dark[data-theme="my-new-theme"] {
  --theme-accent: #darkAccent;
  --theme-accent-hover: #darkHover;
  --theme-accent-muted: rgba(r, g, b, 0.15);
  --theme-accent-foreground: #darkTextOnAccent;
}
```

2. **Import it** in `frontend/src/styles/themes/index.css`:

```css
@import './my-new-theme.css';
```

3. **Register it** in `frontend/src/lib/store/theme-store.ts` by adding an entry to the `AVAILABLE_THEMES` array:

```typescript
{
  id: 'my-new-theme',
  name: 'My New Theme',
  description: 'Brief description',
  colors: ['#accent', '#hover', '#muted', '#bg', '#bgSecondary'],
},
```

No component changes needed — the `ThemeSelector` auto-discovers new entries from `AVAILABLE_THEMES`.

## Design decisions

### Why CSS custom properties instead of Tailwind config?

- **Zero rebuild**: switching themes is instant — no PostCSS recompilation
- **Runtime flexibility**: users can switch themes without a page reload
- **SSR compatible**: `data-theme` attribute is set on `<html>` before paint via `ThemeInitializer`
- **Progressive enhancement**: falls back to geist defaults when no theme is selected

### Why Zustand instead of next-themes?

`next-themes` manages light/dark mode (binary toggle). The color theme system is orthogonal — a user might want Dracula colors in light mode or Catppuccin colors in dark mode. Zustand stores the *which palette* decision separately from the *light or dark* decision.

### What was intentionally NOT migrated?

| File | Reason |
|------|--------|
| `TiptapEditor.tsx` | Functional text-color palette (users pick actual colors for document formatting) |
| `ParticleBackground.tsx` | Three.js `Color` objects — not DOM, CSS variables don't apply |
| `GaussianSplat.tsx` | WebGL scene background — same reason |
| `SparklesAnimation.tsx` | Canvas 2D `fillStyle` — browser canvas API, not CSS |
| `layout.tsx` `<meta>` tags | Browser chrome colors (theme-color, mask-icon) — must be hardcoded for pre-CSS consumption |
| `HeroCard.tsx` SVG illustration | Decorative illustration with deliberate palette — not a UI color |

## Bug fix included

**admin-theme.css and visitor-theme.css** previously used `@media (prefers-color-scheme: dark)` for dark mode, which only responds to OS-level preference — the manual dark mode toggle in the header had no effect on admin/visitor pages. Fixed by switching to `.dark` class selectors, matching the `next-themes` `class` strategy used by Tailwind.
