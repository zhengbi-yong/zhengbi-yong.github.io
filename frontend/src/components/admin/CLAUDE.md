# Admin Components Module

## Purpose
Reusable UI components for the admin dashboard interface.

## Files
- `AdminLayout.tsx` - Main admin layout with sidebar navigation
- `AdminStatsCard.tsx` - Statistics display card
- `BreadcrumbNav.tsx` - Breadcrumb navigation component
- `CommentModeration.tsx` - Comment moderation interface
- `ThemeToggle.tsx` - Dark/light mode toggle
- `UserManagement.tsx` - User management interface

## Architecture

### AdminLayout Component
```
AdminLayout (Client Component)
├── Authentication check
│   ├── Loading state
│   └── Login modal (AuthModal)
├── Sidebar (responsive)
│   ├── Logo
│   ├── Navigation items (active state)
│   └── User section (logout)
├── Top bar
│   ├── Mobile menu toggle
│   ├── BreadcrumbNav
│   └── ThemeToggle
└── Main content area (children)
```

### Navigation Structure
```typescript
const navItems: NavItem[] = [
  { id: 'dashboard', label: '仪表板', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', label: '用户管理', icon: Users, href: '/admin/users' },
  { id: 'comments', label: '评论审核', icon: MessageSquare, href: '/admin/comments' },
  { id: 'posts', label: '文章管理', icon: FileText, href: '/admin/posts' },
  { id: 'analytics', label: '数据分析', icon: BarChart3, href: '/admin/analytics' },
  { id: 'monitoring', label: '系统监控', icon: Activity, href: '/admin/monitoring' },
  { id: 'settings', label: '系统设置', icon: Settings, href: '/admin/settings' },
]
```

### Key Features

#### Authentication
- **Check**: `useAuthStore().checkAuth()` on mount
- **Loading**: Spinner during verification
- **Login**: Modal overlay if not authenticated
- **Logout**: Clears store, redirects to `/`

#### Responsive Design
- **Mobile**: Hidden sidebar (toggle with backdrop)
- **Desktop (lg:)**: Fixed sidebar (w-64), main content offset (lg:pl-64)
- **Transitions**: Smooth slide-in/out animations

#### Active State Detection
```typescript
const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
```

### Component Features

#### AdminStatsCard
- Metric display with icon
- Trend indicator (up/down)
- Customizable label and value
- Responsive sizing

#### BreadcrumbNav
- Dynamic breadcrumb generation
- Based on current pathname
- Clickable navigation links
- Separators (chevrons)

#### CommentModeration
- Comment list with status
- Approve/reject actions
- Bulk operations
- Filter by status

#### ThemeToggle
- Dark/light mode switch
- System preference detection
- Persisted in localStorage
- Smooth transitions

#### UserManagement
- User table/list view
- Role assignment
- Ban/unban functionality
- Search and filter

### Technologies
- React Client Components
- Zustand (useAuthStore)
- lucide-react (icons)
- Tailwind CSS (dark mode)
- next/navigation (routing)

## Integration Points

### Auth Store
```typescript
import { useAuthStore } from '@/lib/store/auth-store'
// State: { user, isAuthenticated, checkAuth, logout }
```

### Auth Modal
```typescript
import { AuthModal } from '@/components/auth/AuthModal'
// Reused authentication modal
```

### Routing
```typescript
import { usePathname } from 'next/navigation'
// Active state detection
```

## Data Flow
```
Admin mount → Check auth → Show loading → Auth success → Render layout → Children render
Auth fail → Show login modal → User logs in → Re-check auth → Render layout
```

## Dependencies
- **Internal**:
  - `@/lib/store/auth-store` - Authentication state
  - `@/components/auth/AuthModal` - Login modal
  - `@/lib/utils` - Utility functions (cn)
- **External**: `lucide-react`, `zustand`

## Styling
- **Primary color**: blue-600
- **Dark mode**: Full support (gray-900, gray-800)
- **Transitions**: Transform duration-300
- **Spacing**: Tailwind spacing scale

## Future Enhancements
- [ ] Notification center
- [ ] Role-based navigation
- [ ] Collapsible sidebar (desktop)
- [ ] Keyboard shortcuts
- [ ] Search functionality
- [ ] Multi-language support
- [ ] Custom themes
