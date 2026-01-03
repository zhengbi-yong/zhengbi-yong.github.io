# Offline Page Module

## Purpose
PWA offline fallback page shown when user loses network connectivity.

## Files
- `page.tsx` - Offline state UI component

## Architecture

### Component Structure
```
OfflinePage (Server Component)
├── Animated cloud icon (react-icons/wi)
├── Status message (Chinese)
├── Cached content navigation
│   ├── Blog list link
│   ├── About link
│   └── Projects link
└── Reconnect button
```

### Key Features
1. **Network Detection**: Integration with service worker for offline detection
2. **Cached Content Access**: Navigation to potentially cached pages
3. **Reconnection**: Manual reload trigger
4. **PWA Promotion**: Installation prompt hint
5. **Bilingual UI**: Chinese interface with dark mode support

### Technologies
- Next.js App Router (Server Component)
- react-icons (WiCloud)
- Tailwind CSS (dark mode support)

## Integration Points

### Service Worker
```typescript
// Triggered by service worker offline event
// navigator.onLine === false
```

### Navigation Links
```typescript
// Static links to potentially cached routes
/blog  // Blog listing
/about  // Author page
/projects  // Projects page
```

## Data Flow
```
User loses network → Service worker detects → Route to /offline → Display cached content links
```

## Dependencies
- **Internal**: None (self-contained)
- **External**: `react-icons/wi`

## Future Enhancements
- [ ] Dynamic cached article list (localStorage/indexedDB)
- [ ] Network status polling with auto-reconnect
- [ ] Offline reading queue
- [ ] Last sync timestamp display
