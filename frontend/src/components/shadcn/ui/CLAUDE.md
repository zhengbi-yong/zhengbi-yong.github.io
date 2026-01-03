# shadcn/ui Component Library

## Overview

Comprehensive collection of shadcn/ui React components built on Radix UI primitives with Tailwind CSS styling. These are copy-paste components (not npm dependencies) that provide accessible, customizable, and themeable UI primitives.

**Purpose**: Reusable UI component library
**Pattern**: Component library (Radix UI + Tailwind)
**Layer**: Layer 2 - UI Components
**Type**: Client-side React components ("use client")

## Module Structure

```
frontend/src/components/shadcn/ui/
├── accordion.tsx          # Collapsible content
├── alert.tsx              # Alert banners
├── badge.tsx              # Status badges
├── button.tsx             # Button component
├── card.tsx               # Card containers
├── dialog.tsx             # Modal dialogs
├── dropdown-menu.tsx      # Dropdown menus
├── input.tsx              # Text input fields
├── label.tsx              # Form labels
├── progress.tsx           # Progress bars
├── separator.tsx          # Visual separators
├── sonner.tsx             # Toast notifications
├── tabs.tsx               # Tab navigation
├── textarea.tsx           # Multi-line text input
└── CLAUDE.md             # This file
```

## Technology Stack

- **Base**: Radix UI primitives (@radix-ui/*)
- **Styling**: Tailwind CSS + class-variance-authority (CVA)
- **Icons**: Lucide React
- **Theming**: CSS variables for theme tokens
- **Type**: Client components ("use client")

## Component Categories

### 1. Form Components

#### Button (`button.tsx`)

**Features**:
- Multiple variants: default, destructive, outline, secondary, ghost, link
- Multiple sizes: default, sm, lg, icon
- Polymorphic `asChild` pattern (render as child component)
- Full TypeScript support with CVA
- Disabled state handling
- Focus ring styling

**Variants**:
```typescript
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
size: 'default' | 'sm' | 'lg' | 'icon'
```

**Usage**:
```typescript
import { Button } from '@/components/shadcn/ui/button'

<Button variant="default" size="default">
  Click me
</Button>

<Button variant="outline" size="sm" asChild>
  <a href="/link">Link Button</a>
</Button>
```

#### Input (`input.tsx`) & Textarea (`textarea.tsx`)

**Features**:
- Standard HTML input/textarea with consistent styling
- Focus ring support
- Disabled state
- Full native props support

**Usage**:
```typescript
import { Input } from '@/components/shadcn/ui/input'
import { Textarea } from '@/components/shadcn/ui/textarea'

<Input type="email" placeholder="Email" disabled={false} />
<Textarea placeholder="Message" rows={5} />
```

#### Label (`label.tsx`)

**Features**:
- Form label with proper for/id association
- Disabled state styling
- Native HTML label support

**Usage**:
```typescript
import { Label } from '@/components/shadcn/ui/label'

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### 2. Navigation Components

#### Tabs (`tabs.tsx`)

**Components**:
- `Tabs` - Root container
- `TabsList` - Tab triggers container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab panel content

**Features**:
- Keyboard navigation (arrow keys)
- Auto-activation on trigger click
- Active state styling
- ARIA attributes for accessibility

**Usage**:
```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shadcn/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### Dropdown Menu (`dropdown-menu.tsx`)

**Components**:
- `DropdownMenu` - Root container
- `DropdownMenuTrigger` - Trigger element
- `DropdownMenuContent` - Menu container (Portal)
- `DropdownMenuItem` - Menu item
- `DropdownMenuCheckboxItem` - Checkbox item
- `DropdownMenuRadioItem` - Radio item
- `DropdownMenuLabel` - Section label
- `DropdownMenuSeparator` - Visual separator
- `DropdownMenuShortcut` - Keyboard shortcut display
- `DropdownMenuGroup` - Item grouping
- `DropdownMenuSub` - Nested submenu
- `DropdownMenuSubTrigger` - Submenu trigger
- `DropdownMenuSubContent` - Submenu content
- `DropdownMenuRadioGroup` - Radio group
- `DropdownMenuPortal` - Portal container

**Features**:
- Portal rendering (z-index layering)
- Keyboard navigation
- Nested submenus
- Checkbox/radio items
- Check/Circle icons for selection state
- Inset option for indentation
- Data-state animations (fade, zoom, slide)

**Usage**:
```typescript
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/shadcn/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Feedback Components

#### Alert (`alert.tsx`)

**Features**:
- Contextual variants (default, destructive)
- Icon support
- Title and description
- Custom styling

**Usage**:
```typescript
import { Alert } from '@/components/shadcn/ui/alert'

<Alert>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This is an alert message.</AlertDescription>
</Alert>
```

#### Sonner (`sonner.tsx`)

**Purpose**: Toast notifications (wrapper around sonner library)

**Features**:
- Toast notifications
- Auto-dismiss
- Position options
- Multiple toasts

**Usage**:
```typescript
import { toast } from 'sonner'

toast('Event has been created')
toast.success('Event created successfully')
toast.error('Event creation failed')
```

#### Progress (`progress.tsx`)

**Features**:
- Indeterminate state
- Custom value (0-100)
- Accessible ARIA attributes

**Usage**:
```typescript
import { Progress } from '@/components/shadcn/ui/progress'

<Progress value={66} />
<Progress /> {/* Indeterminate */}
```

### 4. Layout Components

#### Card (`card.tsx`)

**Components**:
- `Card` - Container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content
- `CardFooter` - Footer section

**Features**:
- Semantic structure
- Consistent spacing
- Border and shadow styling

**Usage**:
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/shadcn/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

#### Dialog (`dialog.tsx`)

**Components**:
- `Dialog` - Root container
- `DialogTrigger` - Trigger element
- `DialogContent` - Modal content (Portal)
- `DialogHeader` - Header section
- `DialogFooter` - Footer section
- `DialogTitle` - Title text
- `DialogDescription` - Description text

**Features**:
- Modal overlay with backdrop
- Portal rendering
- Focus trap (auto-focus on open)
- Escape key to close
- Click outside to close
- ARIA attributes

**Usage**:
```typescript
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/shadcn/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

#### Separator (`separator.tsx`)

**Features**:
- Horizontal or vertical orientation
- Consistent styling
- Accessibility (role="separator")

**Usage**:
```typescript
import { Separator } from '@/components/shadcn/ui/separator'

<Separator /> {/* Horizontal */}
<Separator orientation="vertical" /> {/* Vertical */}
```

#### Accordion (`accordion.tsx`)

**Components**:
- `Accordion` - Root container
- `AccordionItem` - Individual accordion item
- `AccordionTrigger` - Clickable header
- `AccordionContent` - Collapsible content

**Features**:
- Single or multiple open items
- Keyboard navigation
- Animated expand/collapse
- Collapsible icon

**Usage**:
```typescript
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/shadcn/ui/accordion'

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Item 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 5. Display Components

#### Badge (`badge.tsx`)

**Features**:
- Variants: default, secondary, destructive, outline
- Small inline status indicators
- Consistent sizing

**Usage**:
```typescript
import { Badge } from '@/components/shadcn/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

## Styling Architecture

### 1. Tailwind CSS Integration

All components use Tailwind utility classes for styling:
- Consistent design tokens (spacing, colors, rounded corners)
- Responsive modifiers (sm:, md:, lg:)
- Dark mode support (dark:)
- Hover and focus states

### 2. Class Variance Authority (CVA)

Button component uses CVA for variant management:
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { /* ... */ },
      size: { /* ... */ }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
```

**Benefits**:
- Type-safe variant props
- Composable variants
- Default values
- Runtime validation

### 3. cn() Utility Function

Components use `cn()` for conditional class merging:
```typescript
import { cn } from '@/components/lib/utils'

className={cn("base-class", isActive && "active-class", className)}
```

**Features**:
- Merges Tailwind classes intelligently
- Resolves conflicts (later classes win)
- Filters out falsy values
- Prevents class duplication

### 4. Theme Tokens

Components reference CSS variables for theming:
```css
/* CSS variables (defined globally) */
--primary
--foreground
--background
--muted
--accent
--destructive
--ring
--radius
```

**Usage in components**:
```typescript
className="bg-primary text-primary-foreground"
className="focus-visible:ring-ring"
```

## Accessibility

### Radix UI Primitives

All Radix UI components include:
- Keyboard navigation
- ARIA attributes
- Focus management
- Screen reader support
- Semantic HTML

### Common Patterns

**forwardRef Pattern**:
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={cn(...)} {...props} />
  }
)
Button.displayName = "Button"
```

**Benefits**:
- Ref forwarding to DOM elements
- Parent components can attach refs
- Proper TypeScript types

**Data Attributes**:
```typescript
data-[state=open]:animate-in
data-[disabled]:pointer-events-none
```
- Styling based on component state
- No JavaScript state tracking needed

## Client-Side Requirements

All components use "use client" directive:
```typescript
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
```

**Reason**:
- Radix UI uses React context
- Event handlers (onClick, onChange)
- useState for local state
- Portal rendering

## Component Patterns

### 1. Polymorphic Components

Button's `asChild` pattern:
```typescript
<Button asChild>
  <a href="/link">Link</a>
</Button>

// Renders as:
<a href="/link" class="button-styles">Link</a>
```

**Implementation**:
```typescript
import { Slot } from '@radix-ui/react-slot'

const Comp = asChild ? Slot : 'button'
<Comp {...props} />
```

### 2. Compound Component Pattern

Tabs, Dialog, Dropdown Menu use compound components:
```typescript
<Tabs>
  <TabsList>
    <TabsTrigger />
  </TabsList>
  <TabsContent />
</Tabs>
```

**Benefits**:
- Shared state via context
- Flexible composition
- Clear component hierarchy

### 3. Portal Rendering

Dialog, Dropdown Menu render in portals:
```typescript
<DropdownMenuPrimitive.Portal>
  <DropdownMenuPrimitive.Content>
    {/* Menu content */}
  </DropdownMenuPrimitive.Content>
</DropdownMenuPrimitive.Portal>
```

**Benefits**:
- Escapes parent overflow/clipping
- Z-index layering
- Fixed positioning relative to viewport

## Integration Points

### Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.x",
    "@radix-ui/react-alert-dialog": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-label": "^2.x",
    "@radix-ui/react-progress": "^1.x",
    "@radix-ui/react-scroll-area": "^1.x",
    "@radix-ui/react-select": "^2.x",
    "@radix-ui/react-separator": "^1.x",
    "@radix-ui/react-slot": "^1.x",
    "@radix-ui/react-switch": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-toast": "^1.x",
    "@radix-ui/react-tooltip": "^1.x",
    "class-variance-authority": "^0.7.x",
    "lucide-react": "^0.4xx.x",
    "sonner": "^1.x",
    "tailwind-merge": "^2.x",
    "tailwindcss-animate": "^1.x"
  }
}
```

### Utility Functions
```typescript
import { cn } from '@/components/lib/utils'
```

**Location**: `frontend/src/components/lib/utils.ts`

### Theme Configuration
CSS variables defined in:
- `tailwind.css` - Global styles
- Tailwind config - Theme tokens

## Customization

### 1. Modify Component Styles

Since components are copy-paste (not npm packages), edit directly:
```typescript
// Edit button.tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        // Add custom variant
        custom: 'bg-purple-600 text-white hover:bg-purple-700'
      }
    }
  }
)
```

### 2. Theme Customization

Modify CSS variables in `tailwind.css`:
```css
:root {
  --primary: 220 90% 56%; /* Change primary color */
}

.dark {
  --primary: 220 90% 66%; /* Dark mode primary */
}
```

### 3. Tailwind Config Extension

Extend theme in `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // ... other tokens
      }
    }
  }
}
```

## Usage Best Practices

### 1. Import Organization
```typescript
// Group imports by component
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
```

### 2. Composition
```typescript
// Compose components together
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
      <Button>Save</Button>
    </div>
  </CardContent>
</Card>
```

### 3. Controlled Components
```typescript
// Use with React state for controlled inputs
const [value, setValue] = useState('')

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 4. Accessibility Attributes
```typescript
// Radix UI handles most ARIA, but add custom as needed
<Button aria-label="Close dialog">
  <XIcon />
</Button>
```

## Migration from shadcn/ui Docs

These components follow the official shadcn/ui patterns:
- **Source**: https://ui.shadcn.com/
- **Customization**: Edited for project-specific theming
- **Updates**: Manual merge when updating from upstream

## Testing Considerations

### Unit Tests
- Test component rendering
- Test variant props (CVA)
- Test event handlers
- Test accessibility attributes

### Integration Tests
- Test user interactions (click, type, navigate)
- Test keyboard navigation
- Test screen reader output

### Visual Regression
- Test component appearance
- Test dark mode
- Test responsive layouts
- Test focus states

## Performance

### Bundle Size
- **Tree-shakeable**: Import only used components
- **Radix UI**: Primitives are small and optimized
- **No runtime overhead**: Pure CSS (Tailwind)

### Optimization Tips
- Lazy load heavy components (Dialog, Dropdown)
- Use React.memo for frequently re-rendering components
- Avoid inline functions in render (use useCallback)

## Known Limitations

### 1. Client-Side Only
All components require "use client" - cannot use in server components directly.

### 2. CSS Variables
Requires proper CSS variable setup - components won't work without theme tokens.

### 3. Tailwind Dependency
Components rely on Tailwind CSS - not usable with other styling solutions.

### 4. Manual Updates
Unlike npm packages, updates require manual code review and merging.

## Future Enhancements

### Components to Add
- Select (dropdown select)
- Switch (toggle switch)
- Slider (range input)
- Tooltip (hover information)
- Popover (floating content)
- Command palette
- Data table
- Form components (form field wrapper)

### Features to Add
- Server component wrappers (where possible)
- Additional variants
- Animation presets
- Component composition patterns
- Storybook integration

## Related Files
- `@/components/lib/utils` - cn() utility
- `tailwind.css` - CSS variables and global styles
- `tailwind.config.js` - Theme configuration
- Component README files in parent directories

## Maintenance Notes

- **Copy-Paste**: Components are not npm packages - edit files directly
- **Updates**: Check https://ui.shadcn.com/docs/components for updates
- **Theming**: Modify CSS variables, not component classes
- **Accessibility**: Radix UI handles most - test with screen readers
- **TypeScript**: Strict typing - all props validated at compile time

## Resources

- **shadcn/ui Docs**: https://ui.shadcn.com/
- **Radix UI Docs**: https://www.radix-ui.com/
- **CVA Docs**: https://cva.style/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
