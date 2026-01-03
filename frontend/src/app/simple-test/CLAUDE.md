# Simple Test Page Module

## Purpose
Debugging page for testing RDKit chemistry library loading and `useChemistry` hook functionality.

## Files
- `page.tsx` - Chemistry library test page

## Architecture

### Component Structure
```
SimpleTestPage (Client Component)
├── Mounted state check
├── useChemistry hook
│   ├── isLoaded state
│   └── error state
└── Result display
    ├── Loading indicator
    └── JSON result display
```

### State Management
```typescript
// Local component state
const [mounted, setMounted] = useState(false)
const [result, setResult] = useState<string>('Loading...')

// Hook state
const { isLoaded, error } = useChemistry()
```

### Test Flow
1. Component mounts → `setMounted(true)`
2. `useChemistry` hook initializes RDKit
3. Result displays: `RDKit loaded: {boolean}, Error: {string|null}`

### Technologies
- Next.js App Router (Client Component)
- Custom hook: `@/lib/hooks/useChemistry`
- React hooks: `useState`, `useEffect`

## Integration Points

### Chemistry Hook
```typescript
// Custom hook for RDKit management
import { useChemistry } from '@/lib/hooks/useChemistry'
// Returns: { isLoaded: boolean, error: string | null }
```

### RDKit.js
```typescript
// WebAssembly chemistry library
// Loaded via useChemistry hook
```

## Data Flow
```
Component mount → useChemistry() → RDKit load → Display status
```

## Dependencies
- **Internal**: `@/lib/hooks/useChemistry`
- **External**: React hooks

## Usage Notes
- **Development tool**: Not intended for production display
- **RDKit testing**: Verifies WebAssembly loading
- **Hook validation**: Tests custom hook state management

## Future Enhancements
- [ ] Additional chemistry function tests
- [ ] SMILES parsing test
- [ ] Structure rendering test
- [ ] Performance metrics display
- [ ] Multiple library version testing
- [ ] Error boundary integration
