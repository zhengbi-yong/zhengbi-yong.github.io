# `@/components/search` Module

## Layer 1: Module Overview

### Purpose
API-powered search interface with intelligent debouncing, autocomplete suggestions, and real-time results.

### Scope
- Debounced search input (300ms delay)
- Autocomplete suggestions (API-driven)
- Real-time search results display
- Keyboard and click navigation
- Click-outside-to-close functionality

## Layer 2: Component Architecture

### Component: `ApiSearchBar`

**Responsibilities**:
- Capture and debounce user input
- Fetch search suggestions and results
- Display dropdown with suggestions/results
- Handle result navigation and selection

**State Management**:
```typescript
const [query, setQuery] = useState('')              // Raw input
const [debouncedQuery, setDebouncedQuery] = useState('')  // Delayed input
const [showSuggestions, setShowSuggestions] = useState(false)  // Dropdown visibility
```

**Data Fetching**:
```typescript
// Hooks from @/lib/hooks/useBlogData
const { data: searchResults, isLoading } = useSearch(debouncedQuery)
const { data: suggestions } = useSearchSuggestions(query, 5)
```

**Interaction Handlers**:
- `handleInputChange`: Update query + show dropdown
- `handleSuggestionClick`: Use suggestion as query
- `handleResultClick`: Navigate to blog post
- `handleSubmit`: Form submission handler

## Layer 3: Implementation Details

### Debouncing Strategy

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query)
  }, 300)

  return () => clearTimeout(timer)
}, [query])
```

**Purpose**: Prevent excessive API calls during typing
**Delay**: 300ms (balanced responsiveness vs. API load)

### Dropdown Structure

```tsx
{showSuggestions && query.length >= 2 && (
  <div className="dropdown">
    {/* Suggestions (shown before debounced search) */}
    {suggestions && !debouncedQuery && (
      <div>Suggestions...</div>
    )}

    {/* Search results (shown after debounce) */}
    {searchResults && (
      <div>Results...</div>
    )}

    {/* No results state */}
    {searchResults?.results.length === 0 && (
      <div>未找到相关文章</div>
    )}
  </div>
)}
```

### Click-Outside Pattern

```typescript
useEffect(() => {
  const handleClickOutside = () => setShowSuggestions(false)
  document.addEventListener('click', handleClickOutside)
  return () => document.removeEventListener('click', handleClickOutside)
}, [])
```

**Note**: Current implementation closes on any document click (not checking if click is outside)

### Visual States

1. **Idle**: Search icon visible
2. **Loading**: Spinner appears (right side)
3. **Suggestions**: Show autocomplete suggestions
4. **Results**: Show matching posts with title + summary
5. **Empty**: "未找到相关文章" message

### Search Result Interface

```typescript
interface SearchResult {
  id: string
  slug: string
  title: string
  summary?: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
}
```

## Architecture Context

### Integration Points
- **Location**: `@/components/search` → Search functionality
- **Data Layer**: `@/lib/hooks/useBlogData` (React Query hooks)
- **Routing**: `next/navigation` (useRouter)
- **UI Components**: Custom styling (Tailwind)

### Design Patterns
- **Debounced Input**: Delay API calls until user pauses
- **Dual Data Sources**: Suggestions (instant) + Results (debounced)
- **Controlled Component**: React state drives UI
- **Event Cleanup**: Proper event listener removal

### Performance Considerations

**Optimization Techniques**:
1. Debouncing reduces API calls by ~90%
2. Separate hooks for suggestions vs. results
3. Conditional rendering (only show dropdown when needed)

**Potential Improvements**:
- Add keyboard navigation (arrow keys, Enter)
- Implement click-outside properly (check event target)
- Add search history/local storage
- Cache recent searches

### Usage Example

```tsx
import { ApiSearchBar } from '@/components/search'

// In page header
<header>
  <ApiSearchBar />
</header>
```

### Data Flow

```
User Types (300ms)
    ↓
Query State Updates
    ↓
[Suggestions Fetch] (immediate, from query)
    ↓
[Debounced Query Updates]
    ↓
[Search Results Fetch] (from debouncedQuery)
    ↓
Display Dropdown
```

## Dependencies

- `@/lib/hooks/useBlogData`: Data fetching hooks
- `next/navigation`: Client-side routing
- React hooks: `useState`, `useEffect`, `useCallback`
