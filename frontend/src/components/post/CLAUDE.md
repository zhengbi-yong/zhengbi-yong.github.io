# `@/components/post` Module

## Layer 1: Module Overview

### Purpose
Backend integration components for blog post interactions including comments, likes, views, and statistics.

### Scope
- Comment system with nested replies
- Like/toggle functionality with authentication
- View tracking and statistics display
- Backend API integration via Zustand stores
- Authentication-gated interactions

## Layer 2: Component Architecture

### Component: `BackendComments`

**Responsibilities**:
- Fetch and display paginated comments
- Render comment submission form
- Handle comment likes with auth check
- Display nested replies with threading
- Load more comments with cursor pagination

**State Integration**:
```typescript
// Uses comment store for data management
const {
  fetchComments,      // Load comments (with cursor pagination)
  createComment,      // Submit new comment
  likeComment,        // Like/unlike comment
  getComments,        // Get comments by slug
  getCommentsLoading, // Loading state
  hasMore,            // Pagination check
  isCommentLiked      // User's like status
} = useCommentStore()
```

**Features**:
- Auth-gated comment submission
- Character counter (2000 limit)
- HTML-sanitized comment rendering
- Nested reply threading with visual hierarchy
- Load more pagination
- User avatar with first letter
- Formatted timestamps (Chinese locale)

---

### Component: `CommentForm`

**Responsibilities**:
- Simplified comment input interface
- Auth-gated submission
- Character validation
- Success/error feedback via alerts

**Props Interface**:
```typescript
interface CommentFormProps {
  slug: string          // Post identifier
  className?: string    // Additional styling
}
```

**State Management**:
- `newComment`: Textarea content
- `isSubmitting`: Submission state
- `isAuthModalOpen`: Auth modal visibility

---

### Component: `CommentListSimple`

**Responsibilities**:
- Compact comment display (max 5 items)
- Scrollable container with custom scrollbar
- Truncated content (line-clamp-3)
- "View all" scroll-to-section link

**Design Features**:
- Compact avatars (6x6)
- Abbreviated dates (month + day)
- Line-clamped content (3 lines)
- Custom scrollbar styling
- Max height constraint (50vh)

---

### Component: `LikeButton`

**Responsibilities**:
- Toggle like status for posts
- Display like count
- Auth-gated interaction
- Visual feedback (filled icon when liked)

**Props Interface**:
```typescript
interface LikeButtonProps {
  slug: string           // Post identifier
  showCount?: boolean    // Display count (default: true)
  className?: string
}
```

**Visual States**:
- Unliked: Outline style, "赞" or count
- Liked: Pink filled background, filled icon

---

### Component: `PostStats`

**Responsibilities**:
- Display post engagement metrics
- View count, like count, comment count
- Icon-based presentation with tooltips

**Stats Displayed**:
```typescript
{
  view_count: number    // Total views
  like_count: number    // Total likes
  comment_count: number // Total comments
}
```

**Icons Used**:
- `Eye` (lucide-react): Views
- `ThumbsUp`: Likes
- `MessageCircle`: Comments

---

### Component: `PostBackendIntegration`

**Responsibilities**:
- Wrapper component for post backend features
- Auto-record views on mount
- Compose stats and like button
- Render children (article content)

**Usage Pattern**:
```tsx
<PostBackendIntegration slug={post.slug}>
  <article>{post.content}</article>
</PostBackendIntegration>
```

## Layer 3: Implementation Details

### Store Dependencies

**Comment Store** (`@/lib/store`):
```typescript
interface CommentStore {
  fetchComments(slug: string, cursor?: string): Promise<void>
  createComment(slug: string, data: { content: string }): Promise<void>
  likeComment(commentId: string): Promise<void>
  getComments(slug: string): Comment[]
  hasMore(slug: string): boolean
  isCommentLiked(commentId: string): boolean
}
```

**Post Store** (`@/lib/store`):
```typescript
interface PostStore {
  recordView(slug: string): Promise<void>
  fetchStats(slug: string): Promise<void>
  toggleLike(slug: string): Promise<void>
  getStats(slug: string): PostStats | null
  isLiked(slug: string): boolean
}
```

**Auth Store** (`@/lib/store`):
```typescript
interface AuthStore {
  isAuthenticated: boolean
  user: User | null
}
```

### Authentication Flow

All user interactions follow this pattern:
1. User attempts action (comment/like)
2. Check `isAuthenticated` from auth store
3. If not authenticated → Open auth modal
4. If authenticated → Execute action
5. Update store state on success
6. Refresh related data (comments, stats)

### Security Considerations

**HTML Sanitization**:
```tsx
{/* Comments rendered with sanitized HTML */}
<div dangerouslySetInnerHTML={{ __html: comment.html_sanitized }} />
```

**Character Limits**:
- Comments: 2000 characters (enforced + validated)
- Client-side validation before submission

**Rate Limiting**:
- Handled by backend API
- Loading states prevent duplicate submissions

### Integration Example

```tsx
import { BackendComments, LikeButton, PostStats } from '@/components/post'

// Full comment section with stats
<article>
  <PostStats slug="my-post" />
  <LikeButton slug="my-post" />

  <articleContent />

  <BackendComments slug="my-post" />
</article>
```

### Pagination Strategy

**Cursor-based pagination**:
```typescript
// Load more implementation
const handleLoadMore = () => {
  const cursor = comments.length > 0
    ? comments[comments.length - 1].id  // Last comment ID
    : undefined
  fetchComments(slug, cursor)
}
```

**Has more detection**:
```typescript
{hasMore(slug) && (
  <Button onClick={handleLoadMore}>
    加载更多评论
  </Button>
)}
```

## Architecture Context

### Integration Points
- **Location**: `@/components/post` → Post interaction features
- **API Layer**: `@/lib/api` (HTTP client)
- **State Management**: `@/lib/store` (Zustand)
- **Authentication**: `@/components/auth/AuthModal`
- **UI Components**: `@/components/shadcn/ui`

### Data Flow

```
User Action → Component → Store → API → Backend
                    ↓
              State Update → Re-render
```

### Design Patterns
- **Store-Centric**: All data managed in Zustand stores
- **Auth-Gated**: Unauthenticated users see prompts
- **Optimistic UI**: Like toggles update immediately
- **Pagination**: Cursor-based for efficient loading
- **Composition**: Features composed into integration wrapper

### Related Modules
- `@/lib/store`: Comment, post, auth stores
- `@/lib/api`: Backend API endpoints
- `@/components/auth`: Authentication modal
- `@/components/shadcn/ui`: UI primitives
