# Music Dynamic Route Module

## Overview

This module implements a dynamic route for displaying individual music sheet pages. Each route corresponds to a music sheet ID and renders a fullscreen music player interface.

**Purpose**: Display individual music sheet pages with dynamic routing
**Pattern**: Dynamic Route with Static Generation (SSG)
**Layer**: Layer 2 - Page Component

## Module Structure

```
frontend/src/app/music/[name]/
└── page.tsx              # Dynamic page component
```

## Architecture

### Data Flow

```
User visits /music/sheet-id
    ↓
generateStaticParams() provides all music sheet IDs
    ↓
MusicPage component receives params
    ↓
Lookup music sheet by ID from musicData
    ↓
Render FullscreenMusicSheet with src and title
    ↓
notFound() if ID not found
```

### Components

**page.tsx** (23 lines)
- **generateStaticParams()**: Generates static paths for all music sheets
- **MusicPage()**: Page component that renders music sheet player
- **Data Source**: `@/data/musicData` - Pre-defined music sheets array
- **Error Handling**: `notFound()` for invalid music IDs

## Route Parameters

### Dynamic Parameter: `[name]`

- **Type**: `string` (music sheet ID)
- **Source**: URL path segment
- **Encoding**: Standard URL encoding
- **Example**: `/music/piano-fugue` → `params.name = "piano-fugue"`

## Data Models

### MusicSheet (inferred from musicData)

```typescript
interface MusicSheet {
  id: string           // Unique identifier (matches route param)
  src: string          // Audio file path or URL
  title: string        // Display title
}
```

Location: `@/data/musicData`

## Component API

### FullscreenMusicSheet

```typescript
interface FullscreenMusicSheetProps {
  src: string          // Audio source URL
  title: string        // Music title for display
}
```

Location: `@/components/FullscreenMusicSheet`

## Static Generation

### generateStaticParams()

```typescript
export const generateStaticParams = async () => {
  return musicSheets.map((music) => ({
    name: music.id,
  }))
}
```

**Behavior**:
- Scans all music sheets from `musicData`
- Generates static HTML for each music ID
- Pre-renders routes at build time
- Enables fast static page serving

**Output Example**:
```
/music/piano-fugue  →  /music/piano-fugue/index.html
/music/jazz-étude    →  /music/jazz-étude/index.html
```

## Page Rendering Logic

### MusicPage Component

```typescript
export default async function TagPage(props: { params: Promise<{ name: string }> }) {
  const params = await props.params
  const name = params.name

  const musicSheet = musicSheets.find((music) => music.id === name)

  if (!musicSheet) {
    notFound()
  }

  return <FullscreenMusicSheet src={musicSheet.src} title={musicSheet.title} />
}
```

**Execution Flow**:
1. Extract `name` parameter from URL
2. Search `musicData` for matching ID
3. If not found → trigger Next.js 404 page
4. If found → render FullscreenMusicSheet with data

## Error Handling

### Invalid Music ID

```typescript
if (!musicSheet) {
  notFound()
}
```

- **Trigger**: Music ID not found in `musicData`
- **Result**: Next.js default 404 page
- **Status Code**: 404
- **User Experience**: Clear "Not Found" message

## SEO & Metadata

**Note**: This module does not export `generateMetadata()` - using default metadata.

**Recommended Enhancement**:
```typescript
export async function generateMetadata(props: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const params = await props.params
  const musicSheet = musicSheets.find(m => m.id === params.name)

  return {
    title: musicSheet?.title || 'Music Sheet',
    description: `Listen to ${musicSheet?.title}`,
    openGraph: {
      title: musicSheet?.title,
      audio: musicSheet?.src,
    }
  }
}
```

## Dependencies

### Internal
- `@/data/musicData` - Music sheets array
- `@/components/FullscreenMusicSheet` - Music player component
- `next/navigation` - `notFound()` function

### External
- `next/navigation` - Next.js navigation utilities

## Usage Examples

### Accessing Music Pages

```
User navigates to: /music/piano-fugue
    ↓
Next.js serves pre-rendered HTML
    ↓
FullscreenMusicSheet component loads
    ↓
Audio player renders with src and title
```

### Adding New Music Sheets

Update `@/data/musicData`:

```typescript
// musicData.ts
export default [
  {
    id: 'piano-fugue',
    src: '/audio/piano-fugue.mp3',
    title: 'Piano Fugue in C Minor'
  },
  {
    id: 'new-sheet',  // Added this
    src: '/audio/new-sheet.mp3',
    title: 'New Music Sheet'
  }
]
```

Next build will auto-generate `/music/new-sheet` route.

## Constraints & Limitations

- **Static IDs**: Music sheets must be defined at build time
- **No Dynamic IDs**: Cannot add music sheets without rebuild
- **File-based**: Audio files must exist in public directory or be external URLs
- **No Database**: Uses hardcoded array, not CMS or database
- **Limited Metadata**: No per-page metadata generation currently

## Integration Points

1. **Music Data Source**: `@/data/musicData` array (manual or generated)
2. **Audio Files**: `/public/` directory or external CDN
3. **Player Component**: `@/components/FullscreenMusicSheet`
4. **404 Handling**: Next.js default notFound page

## Testing Considerations

- Test with valid music ID
- Test with invalid music ID (should show 404)
- Test static generation (all IDs present in build output)
- Test audio playback functionality
- Test responsive layout of player
- Verify pre-rendered HTML contains correct data

## Future Enhancements

### Metadata Generation
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const music = musicSheets.find(m => m.id === (await params).name)
  return {
    title: music?.title,
    openGraph: { audio: music?.src }
  }
}
```

### Features to Consider
- Add sheet music display alongside audio
- Implement playlist functionality
- Add download links
- Support multiple audio formats
- Add sharing capabilities
- Integrate with analytics
- Add comments/ratings

### Data Source Migration
- Migrate from static array to CMS (Payload CMS)
- Enable dynamic music sheet addition
- Add database backend for real-time updates

## Related Modules

- `@/app/music/` - Parent music section
- `@/data/musicData` - Music sheets data source
- `@/components/FullscreenMusicSheet` - Player component
- Other dynamic routes: `@/app/tags/[tag]`, `@/app/blog/[slug]`

## Maintenance Notes

- **Data Consistency**: Ensure `musicData` IDs match audio file paths
- **Build Performance**: Large music sheet arrays may slow down builds
- **Asset Management**: Keep audio files optimized and compressed
- **URL Stability**: Music IDs should never change (breaking links)
- **Type Safety**: Keep MusicSheet interface in sync with data structure
