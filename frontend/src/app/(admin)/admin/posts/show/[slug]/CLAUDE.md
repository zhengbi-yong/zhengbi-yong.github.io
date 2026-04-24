# Admin Post Detail Page

## Module Overview
**Path**: `frontend/src/app/admin/posts/show/[slug]/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Dynamic Route Page Component
**Depth**: 5 (nested route structure)

Displays detailed statistics and comments for a specific blog post in the admin interface. Provides real-time engagement metrics and comment moderation capabilities.

## Purpose
Admin dashboard page for viewing individual post performance metrics and user engagement data. Enables content administrators to analyze post reach and moderate comments.

## Multi-Layer Architecture

### Layer 1: Application Layer (Top)
- **Route**: `/admin/posts/show/[slug]`
- **Context**: Admin dashboard section
- **Responsibility**: Admin-only content management interface

### Layer 2: Feature Layer
- **Feature**: Post analytics and comment moderation
- **Domain**: Content administration
- **Related Features**:
  - Posts list (`/admin/posts`)
  - Comments management (`/admin/comments`)
  - User management (`/admin/users`)

### Layer 3: Module Layer (Current)
- **Module**: Post detail view component
- **Scope**: Single post analytics display
- **Interface**: Client-side React component

### Layer 4: Integration Layer
- **Data Provider**: Refine (`@refinedev/core`)
- **Router**: Next.js App Router
- **State Management**: React hooks (`useList` from Refine)
- **API Integration**: Custom data provider wrapper

### Layer 5: Foundation Layer (Bottom)
- **HTTP Client**: Axios (via custom data provider)
- **Authentication**: JWT bearer token
- **Backend API**: REST endpoints (`/posts/:slug/stats`, `/posts/:slug/comments`)
- **Database**: PostgreSQL (via backend)

## Cross-Layer Dependencies

### Upward Dependencies (Consumes)
```
Layer 5 (Foundation)
  ├─ Axios HTTP client (via customAxios in dataProvider)
  ├─ HttpOnly Cookie authentication (via withCredentials)
  └─ Backend API endpoints

Layer 4 (Integration)
  ├─ Refine dataProvider (lib/providers/refine-data-provider.ts)
  ├─ Next.js router (next/navigation)
  └─ React hooks

Layer 3 (Module)
  ├─ PostService API (lib/api/backend.ts)
  ├─ CommentService API (lib/api/backend.ts)
  └─ UI components (lucide-react icons)

Layer 2 (Feature)
  └─ Admin layout structure

Layer 1 (Application)
  └─ Route configuration
```

### Downward Dependencies (Provides To)
```
Layer 3 (Current Module)
  ├─ Provides: Post stats visualization
  ├─ Provides: Comment list display
  └─ Provides: Navigation to related admin pages

No downstream dependencies - this is a leaf component
```

## Core Responsibilities

### Data Fetching
- Retrieve post statistics (views, likes, comments) via Refine's `useList`
- Fetch paginated comment list for the specified post
- Handle loading and error states for both data streams

### Display Components
- **Stats Dashboard**: Three-card grid showing:
  - View count (Eye icon, blue)
  - Like count (Heart icon, red)
  - Comment count (MessageSquare icon, green)
- **Comment List**: Paginated display with:
  - User avatar (first letter of username)
  - Username and timestamp
  - Comment content
  - Like count per comment

### Navigation
- Back button to return to previous page
- "View Post" link to open public post in new tab
- "Return to List" button for admin posts list

## Technical Implementation

### Routing
- **Dynamic Route**: `[slug]` parameter extracted via `useParams()`
- **Slug Encoding**: `encodeURIComponent()` for safe API calls
- **Navigation**: Next.js `useRouter()` for programmatic navigation

### State Management
- **Refine Integration**: Uses `@refinedev/core` `useList` hook
- **Query Resources**:
  - `posts/${slug}/stats` - Post statistics endpoint
  - `posts/${slug}/comments` - Comments list endpoint
- **Pagination**: 20 comments per page

### Error Handling
- Loading states with spinner animation
- Error banner for failed stats retrieval
- Empty state for posts without comments

### Dependencies
```typescript
// Core Framework
import { useParams, useRouter } from 'next/navigation'  // Routing
import { useList } from '@refinedev/core'               // Data fetching

// UI Components
import { ArrowLeft, Eye, Heart, MessageSquare } from 'lucide-react'
import { Loader2 } from 'lucide-react'

// API Services
import { postService, commentService } from '@/lib/api/backend'
```

## Component Structure

```
PostDetailPage
├── Header (back button + title + slug)
├── Loading State (spinner)
├── Error State (error banner)
├── Stats Grid (3 StatCard components)
├── Comments Section
│   ├── Header (count + title)
│   ├── Loading State
│   ├── Empty State
│   └── Comment List (Comment items)
└── Actions (view post + return buttons)

StatCard (subcomponent)
├── Title label
├── Value display
└── Icon with color coding
```

## Data Flow

```
1. User navigates to /admin/posts/show/[slug]
   ↓
2. useParams() extracts slug from URL
   ↓
3. useList() hooks trigger parallel API calls:
   - GET /posts/{slug}/stats
   - GET /posts/{slug}/comments
   ↓
4. Render based on state:
   - isPending → Show loading spinner
   - isError → Show error banner
   - isSuccess → Show stats + comments
```

## API Integration

### Endpoints
- **Stats**: `GET /posts/:slug/stats`
  - Returns: `{ view_count, like_count, comment_count }`
- **Comments**: `GET /posts/:slug/comments`
  - Returns: `{ comments: [{ id, user, content, created_at, like_count }] }`

### Response Types
```typescript
interface PostStats {
  view_count: number
  like_count: number
  comment_count: number
}

interface Comment {
  id: string
  user: {
    username: string
  }
  content: string
  created_at: string
  like_count: number
}
```

## Styling
- **Framework**: Tailwind CSS
- **Dark Mode**: Full support with `dark:` prefixes
- **Responsiveness**: Grid adapts from 1 to 3 columns (`grid-cols-1 sm:grid-cols-3`)
- **Color Scheme**: Semantic colors for metrics (blue/red/green)

## Key Features
1. **Real-time Data**: Fetches latest stats on every page load
2. **User Avatar**: Generates avatar from username initial
3. **Timestamp Formatting**: Uses `toLocaleString('zh-CN')` for Chinese locale
4. **Number Formatting**: `toLocaleString()` for thousand separators
5. **Error Recovery**: Clear error messaging with actionable guidance

## Accessibility
- Semantic HTML structure
- Descriptive button labels and titles
- Color contrast meets WCAG standards
- Loading states with text feedback

## Future Enhancements
- Comment moderation actions (delete, approve, spam)
- Date range filtering for stats
- Export comment data as CSV
- Real-time updates via WebSocket
- Reply to comments functionality
