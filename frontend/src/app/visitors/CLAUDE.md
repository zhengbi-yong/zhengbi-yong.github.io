# Visitors Page Module

## Purpose
Displays geographical distribution of website visitors on an interactive map with statistics.

## Files
- `page.tsx` - Server Component for visitors page
- `.data/visitors.json` - Stored visitor data (runtime file by default)

## Architecture

### Component Structure
```
VisitorsPage (Server Component)
├── Header
│   ├── Title ("访客地图")
│   └── Description
├── Statistics cards (grid)
│   ├── Total visitors
│   ├── Unique countries
│   └── Total visits
├── Interactive map
│   └── VisitorMapClient (Client Component)
└── Visitors table
    └── Visitor rows (sortable)
```

### Data Flow
```
Server Component (Async)
├── Read .data/visitors.json (runtime helper)
├── Parse JSON → VisitorData[]
├── Calculate statistics
└── Pass to VisitorMapClient (props)
```

### Visitor Data Schema
```typescript
interface VisitorData {
  ip: string
  country: string
  city: string
  lat: number
  lon: number
  timezone: string
  firstVisit: string (ISO date)
  lastVisit: string (ISO date)
  visitCount: number
}
```

### Statistics Calculation
```typescript
const totalVisitors = visitors.length
const uniqueCountries = new Set(visitors.map((v) => v.country)).size
const totalVisits = visitors.reduce((sum, v) => sum + v.visitCount, 0)
```

### Development Mode
```typescript
// Fallback test data when the runtime visitors file is empty
if (process.env.NODE_ENV === 'development' && visitors.length === 0) {
  visitors = [ /* Test data */ ]
}
```

### Technologies
- Next.js App Router (Server + Client Components)
- Node.js `fs` module (server-side file reading)
- VisitorMapClient (interactive map component)
- Tailwind CSS (dark mode support)

## Integration Points

### Data Storage
```typescript
// File-based storage (runtime data directory)
const visitorsFilePath = process.env.VISITORS_FILE || path.join(process.cwd(), '.data', 'visitors.json')
```

### Client Component
```typescript
import VisitorMapClient from '@/components/VisitorMapClient'
// Receives visitors as props (server → client boundary)
```

### Type System
```typescript
import type { VisitorData } from '@/lib/types/visitor'
```

### Visitor Tracking
```typescript
// Data populated by POST /api/visitor
// Called by visitor tracking script
```

## Data Flow
```
.data/visitors.json (file) → Server Component → Statistics → VisitorMapClient → Interactive map
```

## Dependencies
- **Internal**:
  - `@/components/VisitorMapClient` - Map visualization
  - `@/lib/types/visitor` - TypeScript interfaces
- **External**: `fs`, `path` (Node.js built-ins)

## Security Considerations
- IP addresses displayed in table (consider masking)
- File read errors gracefully handled (returns empty array)
- No write operations (read-only display)

## Future Enhancements
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Date range filtering
- [ ] Export functionality (CSV/JSON)
- [ ] Heat map overlay
- [ ] City clustering for dense areas
- [ ] IP address anonymization
- [ ] Database storage (PostgreSQL/MongoDB)
