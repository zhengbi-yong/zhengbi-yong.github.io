# `@/lib/ui` Module

## Layer 1: Module Overview

### Purpose
UI state management with Zustand for modals, sidebars, theme, and other interface-related state.

### Scope
- Theme management (light/dark/system)
- Modal state (open/close, active modal)
- Sidebar state (open/close)
- Toast notifications
- Loading overlays
- Responsive breakpoints

## Layer 2: Architecture

### Files
- **UIStore.ts**: Main UI store with theme, modals, sidebar

### Store Structure

**State Interface**:
```typescript
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  systemTheme: 'light' | 'dark'
  effectiveTheme: 'light' | 'dark'  // Resolved theme

  // Modals
  activeModal: string | null
  modalData: Record<string, unknown>

  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Loading
  isLoading: boolean
  loadingMessage: string | null

  // Toast
  toasts: Toast[]

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  openModal: (modalId: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean, message?: string) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
```

## Layer 3: Implementation Details

### Theme Management

**Theme Resolution**:
```typescript
const getEffectiveTheme = (
  theme: UIState['theme'],
  systemTheme: UIState['systemTheme']
): 'light' | 'dark' => {
  if (theme !== 'system') return theme
  return systemTheme
}
```

**System Theme Detection**:
```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (e: MediaQueryListEvent) => {
    setSystemTheme(e.matches ? 'dark' : 'light')
  }

  mediaQuery.addEventListener('change', handleChange)
  setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

  return () => mediaQuery.removeEventListener('change', handleChange)
}, [])
```

**Theme Persistence**:
```typescript
import { persist } from 'zustand/middleware'

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // ... store config
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)
```

### Modal Management

**Open Modal**:
```typescript
openModal: (modalId, data) => set({
  activeModal: modalId,
  modalData: { [modalId]: data }
})
```

**Usage**:
```typescript
import { useUIStore } from '@/lib/ui/UIStore'

function LoginButton() {
  const { openModal } = useUIStore()

  return (
    <button onClick={() => openModal('login')}>
      Login
    </button>
  )
}

function LoginModal() {
  const { activeModal, closeModal } = useUIStore()

  if (activeModal !== 'login') return null

  return (
    <Modal onClose={closeModal}>
      <LoginForm />
    </Modal>
  )
}
```

### Sidebar State

**Responsive Behavior**:
```typescript
const useSidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  // Auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return { sidebarOpen, setSidebarOpen }
}
```

### Toast Notifications

**Toast Interface**:
```typescript
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}
```

**Add Toast**:
```typescript
addToast: (toast) => set((state) => ({
  toasts: [...state.toasts, { ...toast, id: generateId() }]
}))
```

**Auto-Remove**:
```typescript
useEffect(() => {
  const { toasts } = useUIStore.getState()

  toasts.forEach(toast => {
    if (toast.duration) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }
  })
}, [toasts])
```

**Usage**:
```typescript
import { useUIStore } from '@/lib/ui/UIStore'

function SaveButton() {
  const { addToast } = useUIStore()

  const handleSave = async () => {
    try {
      await saveData()
      addToast({
        message: '保存成功！',
        type: 'success',
        duration: 3000
      })
    } catch {
      addToast({
        message: '保存失败，请重试',
        type: 'error',
        duration: 5000
      })
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

### Loading State

**Global Loading**:
```typescript
import { useUIStore } from '@/lib/ui/UIStore'

function App() {
  const { isLoading, loadingMessage } = useUIStore()

  return (
    <>
      {isLoading && (
        <LoadingOverlay message={loadingMessage} />
      )}
      <AppContent />
    </>
  )
}
```

**Usage in Hooks**:
```typescript
async function fetchPosts() {
  const { setLoading } = useUIStore.getState()

  try {
    setLoading(true, '加载文章中...')
    const posts = await api.getPosts()
    return posts
  } finally {
    setLoading(false)
  }
}
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/ui` → UI state
- **Used By**: All UI components
- **Framework**: Zustand
- **Persistence**: localStorage

### Design Patterns
- **Centralized State**: Single source of truth for UI
- **Subscriber Pattern**: Components subscribe to specific state
- **Action Pattern**: State updates via actions

### Usage Examples

**Theme Switcher**:
```typescript
function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useUIStore()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {effectiveTheme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
```

**Modal Composition**:
```typescript
function Modals() {
  const { activeModal, modalData, closeModal } = useUIStore()

  return (
    <>
      {activeModal === 'login' && (
        <LoginModal data={modalData.login} onClose={closeModal} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal data={modalData.settings} onClose={closeModal} />
      )}
    </>
  )
}
```

**Sidebar Toggle**:
```typescript
function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <button onClick={toggleSidebar}>
      {sidebarOpen ? '×' : '☰'}
    </button>
  )
}
```

## Best Practices

1. **Co-locate Related UI State**: Group related state (modals together)
2. **Minimal State**: Store only essential UI state
3. **Derived State**: Compute derived values in selectors
4. **Persistence**: Only persist necessary state (theme, not loading)
5. **Type Safety**: Strong TypeScript types

## Performance Tips

**Selector Optimization**:
```typescript
// Bad - Re-renders on any UI change
const { theme, sidebarOpen, activeModal } = useUIStore()

// Good - Only re-renders on theme change
const theme = useUIStore((state) => state.theme)
```

**Shallow Compare**:
```typescript
import { shallow } from 'zustand/shallow'

const { theme, sidebarOpen } = useUIStore(
  (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
  shallow
)
```

## Testing

**Test Store Actions**:
```typescript
import { useUIStore } from '@/lib/ui/UIStore'

test('toggleSidebar changes state', () => {
  const { toggleSidebar, sidebarOpen } = useUIStore.getState()

  expect(sidebarOpen).toBe(false)

  toggleSidebar()

  expect(useUIStore.getState().sidebarOpen).toBe(true)
})
```

## Dependencies

- `zustand`: State management
- `zustand/middleware`: Persist, devtools

## Related Modules

- `@/lib/store`: Other app stores
- `@/components/ui`: UI components using store
- `@/app/layout`: Root layout with theme provider
