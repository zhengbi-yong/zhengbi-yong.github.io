# Lib Components Module Documentation

## Overview

This module provides utility components and helper functions used across the application. It focuses on reusable, lightweight functionality.

## Components

### utils
**File**: `utils.ts`

Utility functions for styling and class management.

**Exports**:
```typescript
function cn(...inputs: ClassValue[]): string
```

**Description**:
Merges Tailwind CSS classes using `clsx` and `tailwind-merge`. Combines conditional classes and resolves conflicts by removing duplicate classes.

**Dependencies**:
- `clsx`: Conditional class names
- `tailwind-merge`: Merge Tailwind classes without conflicts

**Usage Examples**:

```tsx
import { cn } from '@/components/lib/utils'

// Basic usage
cn('px-4 py-2', 'bg-blue-500')
// Output: "px-4 py-2 bg-blue-500"

// Conditional classes
cn('base-class', isActive && 'active-class', hasError && 'error-class')
// Output: "base-class active-class" (when isActive=true)

// Conflict resolution
cn('px-4 py-2', 'px-6')  // Second px- takes precedence
// Output: "px-6 py-2"

// With component props
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
}

function Button({ variant = 'primary', className }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className  // Allow custom overrides
      )}
    >
      Click me
    </button>
  )
}
```

**Common Patterns**:

1. **Component Base Classes + Variants**:
```tsx
className={cn(
  'base-styles',
  variant === 'default' && 'variant-styles',
  className
)}
```

2. **Responsive Overrides**:
```tsx
className={cn(
  'text-sm md:text-base lg:text-lg',
  isMobile && 'text-xs'
)}
```

3. **Dark Mode Support**:
```tsx
className={cn(
  'bg-white text-gray-900',
  'dark:bg-gray-800 dark:text-white'
)}
```

4. **Conditional Styling**:
```tsx
className={cn(
  'border rounded',
  isError && 'border-red-500',
  isSuccess && 'border-green-500',
  !isError && !isSuccess && 'border-gray-300'
)}
```

## Design Philosophy

### Single Responsibility
- `cn()`: One purpose - merge CSS classes
- No logic coupling
- Pure function (no side effects)

### Tailwind Integration
- Resolves Tailwind class conflicts
- Maintains specificity order
- Supports all Tailwind utilities

### Performance
- Minimal overhead (function call only)
- No runtime dependencies beyond utilities
- Tree-shakeable imports

## Best Practices

1. **Always use `cn()` for conditional classes**:
```tsx
// Good
className={cn('base', condition && 'conditional')}

// Avoid
className={`base ${condition ? 'conditional' : ''}`}
```

2. **Order matters** - later classes override earlier ones:
```tsx
cn('px-4 py-2', className)  // User props can override
```

3. **Use for component composition**:
```tsx
const BaseStyles = 'px-4 py-2 rounded'
const Button = (props) => <button className={cn(BaseStyles, props.className)} />
```

4. **Combine with TypeScript**:
```tsx
type Variant = 'primary' | 'secondary'
interface Props {
  variant?: Variant
  className?: string
}
```

## Integration Points

### With Tailwind CSS
- Designed for Tailwind utility classes
- Resolves conflicts like `px-4` vs `px-6`
- Supports responsive prefixes (`md:`, `lg:`)
- Supports state prefixes (`hover:`, `focus:`)

### With Shadcn/UI
- Commonly used with Shadcn components
- Enables custom styling while maintaining defaults
- Pattern used in component libraries

### With Component Props
- `className` prop pattern
- User customization without breaking defaults
- Composable styling system

## File Structure

```
lib/
└── utils.ts    # Class name utility
```

## Dependencies

```
- clsx: ^2.0.0
- tailwind-merge: ^2.0.0
```

## Export Summary

```typescript
export { cn } from './utils'
```

## Usage in Project

This utility is used extensively throughout the codebase for:

1. **Component Styling**: Merging base classes with variants
2. **Conditional Rendering**: Dynamic class application
3. **Theme Support**: Dark mode class combinations
4. **User Customization**: Allowing `className` prop overrides
5. **Responsive Design**: Combining responsive breakpoints

## Examples from Codebase

### Button Component Pattern
```tsx
const Button = ({ variant, className, ...props }) => (
  <button
    className={cn(
      'rounded-lg font-medium transition-colors',
      variant === 'primary' && 'bg-primary text-white',
      variant === 'ghost' && 'hover:bg-gray-100',
      className
    )}
    {...props}
  />
)
```

### Card Component Pattern
```tsx
const Card = ({ hovered, className, children }) => (
  <div
    className={cn(
      'rounded-lg border bg-white',
      hovered && 'shadow-lg',
      className
    )}
  >
    {children}
  </div>
)
```

### Input Component Pattern
```tsx
const Input = ({ error, className, ...props }) => (
  <input
    className={cn(
      'rounded border px-3 py-2',
      error && 'border-red-500',
      className
    )}
    {...props}
  />
)
```

## Future Extensions

Potential additions to this module:
- Date formatting utilities
- Number formatting utilities
- String manipulation helpers
- Validation helpers
- Type guards

## Notes

- Keep this module lightweight
- Only add utilities with 3+ uses
- Prefer pure functions
- Document complex logic
- Type all parameters
