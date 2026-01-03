# `@/components/social-icons` Module

## Layer 1: Module Overview

### Purpose
Social media icon links with validation and consistent styling.

### Scope
- 13 social platforms (Mail, GitHub, Facebook, YouTube, LinkedIn, Twitter/X, Mastodon, Threads, Instagram, Medium, Bluesky)
- Email validation for mailto links
- Responsive sizing
- Accessibility with screen reader support

## Layer 2: Component Architecture

### Component: `SocialIcon`

**Responsibilities**:
- Render social media icon links
- Validate email addresses for mailto links
- Apply consistent hover effects
- Provide screen reader text

**Props Interface**:
```typescript
type SocialIconProps = {
  kind: keyof typeof components  // Platform identifier
  href: string | undefined       // Link URL
  size?: number                  // Icon size in Tailwind units (default: 8)
}
```

**Supported Platforms**:
```typescript
const components = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  x: X,
  mastodon: Mastodon,
  threads: Threads,
  instagram: Instagram,
  medium: Medium,
  bluesky: Bluesky,
}
```

## Layer 3: Implementation Details

### Email Validation

```typescript
// Mailto link validation
if (
  kind === 'mail' &&
  !/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(href)
) {
  return null  // Don't render invalid email links
}
```

**Regex Pattern**:
- Requires `mailto:` prefix
- Standard email format validation
- TLD validation (min 2 chars)

### Accessibility Features

```tsx
<a className="..." aria-label={`${kind} link`}>
  <span className="sr-only">{kind}</span>
  <SocialSvg className="..." />
</a>
```

- `sr-only` class hides text visually but keeps it available to screen readers
- `target="_blank"` + `rel="noopener noreferrer"` for external links

### Dynamic Size Classes

```tsx
className={`h-${size} w-${size}`}
// size=8 → "h-8 w-8"
// size=6 → "h-6 w-6"
```

**Note**: This relies on Tailwind's JIT mode generating size classes dynamically.

### Icon Styling

```tsx
className={`
  hover:text-primary-500
  dark:hover:text-primary-400
  fill-current
  text-gray-700
  dark:text-gray-200
  h-${size}
  w-${size}
`}
```

**Style Tokens**:
- `fill-current`: Inherits text color for SVG fill
- Dark mode support with `dark:` prefix
- Hover state with color transition

## Architecture Context

### Integration Points
- **Location**: `@/components/social-icons` → Social links
- **Icon Sources**: `./icons.tsx` (SVG components)
- **Usage**: Footer, navbar, author bios

### Design Patterns
- **Component Registry**: `components` object maps kinds to SVG components
- **Null Rendering**: Returns `null` for invalid inputs (defensive programming)
- **Accessibility**: Hidden text for screen readers

### Usage Examples

```tsx
import SocialIcon from '@/components/social-icons'

// GitHub link
<SocialIcon kind="github" href="https://github.com/user" size={6} />

// Email link
<SocialIcon kind="mail" href="mailto:user@example.com" />

// Invalid email (won't render)
<SocialIcon kind="mail" href="invalid-email" />

// Missing href (won't render)
<SocialIcon kind="twitter" href={undefined} />
```

### Icon SVG Structure

Each icon in `./icons.tsx` exports an SVG component:

```tsx
export function Github({ size = 8 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-${size} w-${size}`}
      // ... path data
    />
  )
}
```

## Dependencies

- React: Component rendering
- Tailwind CSS: Styling
- Lucide React (likely): Icon SVG paths

## Extension Guide

**Adding New Social Platforms**:

1. Create SVG component in `./icons.tsx`:
```tsx
export function TikTok({ size = 8 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-${size} w-${size}`}>
      {/* TikTok icon path */}
    </svg>
  )
}
```

2. Register in `components` object:
```typescript
const components = {
  // ...existing
  tiktok: TikTok,
}
```

3. Use component:
```tsx
<SocialIcon kind="tiktok" href="https://tiktok.com/@user" />
```
