# zh-CN Locale Module

## Module Overview

Chinese (Simplified) localization strings for the application, providing comprehensive UI text translations.

## Architecture Layer

### Layer 3: Module Locale System

```
locales/
└── zh-CN/
    └── common.json
```

**Scope**: Module-level locale definitions
**Hierarchy**: Global locale system → Module locales → Component usage

## Module Structure

### File Organization

**common.json** - Centralized translation file
- **Navigation** (`nav`): Main navigation items
- **Common UI** (`common`): Reusable interface text
- **Analytics** (`analytics`): Engagement metrics labels
- **Footer** (`footer`): Site footer text
- **Error Pages** (`error`): Error messaging

## Implementation Patterns

### Translation Keys

```typescript
// Access pattern
import common from '@/locales/zh-CN/common.json'

// Key structure: namespace.key.subkey
common.nav.home        // "首页"
common.common.loading   // "加载中..."
```

### Key Categories

**Navigation Keys**
- Home, About, Projects, Blog, Search
- Theme options (light/dark/system)

**Common UI Keys**
- Actions: save, edit, delete, confirm, cancel, retry
- Navigation: back, next, previous
- Content: readMore, share, copy, searchPlaceholder
- Meta: tags, categories, publishedOn, readingTime
- Comments: leaveComment, viewComments

**Analytics Keys**
- Metrics: popularity, engagementScore, views, avgReadingTime
- Time units: minute, second (with singular forms)

**Error Keys**
- Page not found
- Something went wrong
- Action buttons

## Integration Points

### i18n Framework
- Used by: `next-i18next` or custom i18n provider
- File location convention: `locales/{language}/{namespace}.json`

### Component Usage
```typescript
// In components
import t from '@/locales/zh-CN/common.json'

<button>{t.common.save}</button>
<span>{t.nav.home}</span>
```

## Extension Guide

### Adding New Translations

1. **Add key to JSON**:
```json
{
  "newSection": {
    "key": "translation"
  }
}
```

2. **Update type definitions** (if using TypeScript):
```typescript
interface Translations {
  newSection: {
    key: string
  }
}
```

3. **Maintain consistency**:
   - Use existing key structures
   - Follow naming conventions (camelCase)
   - Group related keys

### Translation Best Practices

- **Clarity**: Simple, direct translations
- **Context-aware**: Consider UI placement
- **Consistency**: Use same terms across keys
- **Brevity**: UI text should be concise
- **Cultural appropriateness**: Natural Chinese expressions

## Dependencies

**External**: None
**Internal**: None (standalone locale data)

## Related Modules

- `/locales/en-US` - English translations
- `/lib/i18n` - i18n framework integration
- `/app/**/*` - Translation usage throughout app

## Testing Considerations

- Verify all keys have translations
- Check text fit in UI components
- Validate locale loading
- Test language switching functionality

## Maintenance Notes

- **Update frequency**: As new UI features added
- **Review cycle**: Each release for consistency
- **Tools**: Consider i18n key management tools
- **Missing translations**: Fallback to default locale
