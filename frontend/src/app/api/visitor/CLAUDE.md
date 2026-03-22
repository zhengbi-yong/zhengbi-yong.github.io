# Visitor API Route (api/visitor)

## Overview
Next.js 16 API route for tracking visitor information including IP address and geolocation data. Persists visitor data to a runtime JSON file with visit counting and timestamp tracking.

## Technology Stack
- **Framework**: Next.js 16 (App Router API Route)
- **Runtime**: Node.js (fs module usage)
- **Storage**: JSON file (`.data/visitors.json` by default)
- **Type**: TypeScript
- **Logging**: Custom logger utility

## Route Configuration

### File-Based Routing
```
frontend/src/app/api/visitor/
├── route.ts          # API route handler
└── CLAUDE.md         # This file
```

**URL Pattern**: `/api/visitor`

### Supported Methods
- **POST**: Record visitor IP and geolocation

### Route Settings
```typescript
export const dynamic = 'force-dynamic'
```
**Note**: The route must execute at runtime because it reads and writes mutable visitor data.

## Core Implementation

### 1. Data Storage
```typescript
const visitorsFilePath = process.env.VISITORS_FILE || path.join(process.cwd(), '.data', 'visitors.json')
```
- **Location**: Runtime data directory (`.data/visitors.json` by default)
- **Format**: JSON array of `VisitorData` objects
- **Persistence**: File-based storage (no database)

### 2. File Operations

#### Read Visitors
```typescript
async function readVisitors(): Promise<VisitorData[]> {
  try {
    const data = await fs.readFile(VISITORS_FILE, 'utf-8')
    return JSON.parse(data) as VisitorData[]
  } catch (error) {
    return []  // Returns empty array if file doesn't exist
  }
}
```
**Behavior**: Gracefully handles missing file by returning empty array.

#### Write Visitors
```typescript
async function writeVisitors(visitors: VisitorData[]): Promise<void> {
  await fs.writeFile(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8')
}
```
**Format**: Pretty-printed JSON (2-space indentation).

### 3. POST Handler

#### Request Processing Flow
```typescript
1. Extract client IP from request
2. Check if IP is local/private
3. Fetch geolocation data
4. Read existing visitors
5. Update existing or add new visitor
6. Persist to file
7. Return success response
```

#### IP Detection
```typescript
const ip = getClientIP(request)
```
**Utility**: `@/lib/utils/ip-geolocation`

#### Local IP Detection
```typescript
const isLocal =
  ip === 'unknown' ||
  ip === '::1' ||
  ip.startsWith('127.') ||
  ip.startsWith('192.168.') ||
  ip.startsWith('10.')
```

**Patterns**:
- `unknown` - Unable to determine
- `::1` - IPv6 localhost
- `127.*` - IPv4 loopback
- `192.168.*` - Private network
- `10.*` - Private network

#### Environment-Based Behavior
```typescript
// Development
if (isLocal && NODE_ENV === 'development') {
  return NextResponse.json(
    { success: false, message: '开发环境：本地IP，跳过记录' },
    { status: 200 }
  )
}

// Production
if (isLocal && NODE_ENV === 'production') {
  return NextResponse.json(
    { success: false, message: '无法获取IP地址' },
    { status: 400 }
  )
}
```

**Logic**:
- **Development**: Silently skip local IPs (status 200)
- **Production**: Reject local IPs with error (status 400)

#### Geolocation Lookup
```typescript
const geolocation = await getGeolocation(ip)
```
**Utility**: `@/lib/utils/ip-geolocation`
**Returns**: Geolocation data or `undefined`

#### Error Handling (Geolocation)
```typescript
if (!geolocation) {
  if (NODE_ENV === 'development') {
    return NextResponse.json(
      { success: false, message: '开发环境：本地IP，跳过记录' },
      { status: 200 }
    )
  }
  return NextResponse.json(
    { success: false, message: '无法获取地理位置信息' },
    { status: 400 }
  )
}
```

### 4. Visitor Update Logic

#### Existing Visitor (Update)
```typescript
const existingIndex = visitors.findIndex((v) => v.ip === ip)

if (existingIndex >= 0) {
  const existing = visitors[existingIndex]
  visitors[existingIndex] = {
    ...existing,
    ...geolocation,        // Update geolocation
    ip: existing.ip,        // Preserve original IP
    firstVisit: existing.firstVisit,  // Preserve first visit
    lastVisit: now,         // Update last visit
    visitCount: existing.visitCount + 1,  // Increment count
  }
}
```

**Updates**:
- Last visit timestamp
- Visit count (increment)
- Geolocation data (may have changed)

**Preserves**:
- IP address
- First visit timestamp

#### New Visitor (Create)
```typescript
else {
  const newVisitor: VisitorData = {
    ip,
    ...geolocation,
    firstVisit: now,
    lastVisit: now,
    visitCount: 1,
  }
  visitors.push(newVisitor)
}
```

**Initializes**:
- IP address
- Geolocation data
- First visit = now
- Last visit = now
- Visit count = 1

## Type Definitions

### VisitorData
```typescript
interface VisitorData {
  ip: string                    // IP address
  country: string               // Country name
  city: string                  // City name
  lat: number                   // Latitude
  lon: number                   // Longitude
  timezone: string              // IANA timezone
  firstVisit: string            // ISO timestamp
  lastVisit: string             // ISO timestamp
  visitCount: number            // Total visits
}
```

## API Responses

### Success Response
```typescript
// Status: 200
{
  success: true,
  message: "访客记录已保存"
}
```

### Error Responses

#### Local IP (Production)
```typescript
// Status: 400
{
  success: false,
  message: "无法获取IP地址"
}
```

#### Geolocation Failed
```typescript
// Status: 400
{
  success: false,
  message: "无法获取地理位置信息"
}
```

#### Server Error
```typescript
// Status: 500
{
  success: false,
  message: "服务器错误"
}
```

#### Development Local IP (Silent)
```typescript
// Status: 200
{
  success: false,
  message: "开发环境：本地IP，跳过记录"
}
```

## Data Structure

### visitors.json Format
```json
[
  {
    "ip": "203.0.113.1",
    "country": "United States",
    "region": "California",
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "firstVisit": "2025-01-03T10:00:00.000Z",
    "lastVisit": "2025-01-03T15:30:00.000Z",
    "visitCount": 5
  },
  {
    "ip": "198.51.100.1",
    "country": "Germany",
    "region": "Bavaria",
    "city": "Munich",
    "latitude": 48.1351,
    "longitude": 11.5820,
    "firstVisit": "2025-01-03T12:00:00.000Z",
    "lastVisit": "2025-01-03T12:00:00.000Z",
    "visitCount": 1
  }
]
```

## Error Handling

### Try-Catch Wrapper
```typescript
try {
  // All operations
} catch (error) {
  logger.error('[Visitor API] Error:', error)
  return NextResponse.json(
    { success: false, message: '服务器错误' },
    { status: 500 }
  )
}
```

**Logging**: Uses `@/lib/utils/logger` with prefix `[Visitor API]`

### Graceful Degradation
- Missing `visitors.json` → Auto-creates the file and returns an empty array
- Failed geolocation → Environment-specific response
- File write errors → Caught by outer try-catch

## Integration Points

### Utilities
```typescript
import { getClientIP, getGeolocation } from '@/lib/utils/ip-geolocation'
import { logger } from '@/lib/utils/logger'
import type { VisitorData } from '@/lib/types/visitor'
```

### Dependencies
- `@/lib/utils/ip-geolocation` - IP extraction and geolocation
- `@/lib/utils/logger` - Error logging
- `@/lib/types/visitor` - Type definitions
- `fs/promises` - File operations
- `path` - Path manipulation

## Deployment Considerations

### File Permissions
- **Read**: Application must have read access to the configured visitors file
- **Write**: Application must have write access to `VISITOR_DATA_DIR` or the parent directory of `VISITORS_FILE`
- **Create**: The runtime must be able to create `.data/visitors.json` when the file is absent

### Production Concerns
- **Concurrent writes**: File-based storage is not atomic (race conditions possible)
- **Scalability**: Not suitable for high-traffic sites
- **Backup**: No automatic backup of `.data/visitors.json`
- **Performance**: File I/O on every request

### Static Export Limitation
```typescript
export const dynamic = 'force-dynamic'
```
**Issue**: Visitor tracking is mutable runtime state and cannot be safely frozen at build time
**Purpose**: Ensures read/write operations always execute on the live server
**Recommendation**: Use dynamic deployment (Vercel, Node.js server)

## Security Considerations

### IP Privacy
- **Logging**: Stores IP addresses permanently
- **Retention**: No automatic deletion
- **GDPR**: May require privacy policy and consent

### Geolocation Privacy
- **Precision**: Stores city-level location
- **Data Source**: External geolocation service
- **Consent**: Should disclose in privacy policy

### Rate Limiting
- **Missing**: No rate limiting implemented
- **Risk**: Vulnerable to log flooding
- **Recommendation**: Add rate limiting middleware

### Input Validation
- **IP Format**: Trusted from `getClientIP` utility
- **Geolocation**: Trusted from `getGeolocation` utility
- **File Path**: Controlled via `VISITOR_DATA_DIR` / `VISITORS_FILE`

## Best Practices

### Error Handling
- Graceful file not found (empty array)
- Environment-specific error responses
- Centralized error logging
- User-friendly error messages (Chinese)

### Data Integrity
- Atomic read-modify-write operations
- Type-safe JSON parsing
- Preserved first visit timestamp
- Increment visit count safely

### Code Organization
- Separate read/write functions
- Clear variable naming
- Inline comments for logic
- Environment-based behavior

## Client Integration

### Frontend Usage Example
```typescript
// Record visitor on page load
useEffect(() => {
  fetch('/api/visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Visitor recorded')
      }
    })
    .catch(err => console.error('Failed to record visitor:', err))
}, [])
```

### Automatic Tracking
```typescript
// Add to root layout
// app/layout.tsx
useEffect(() => {
  fetch('/api/visitor', { method: 'POST' })
}, [])
```

## Testing

### Manual Testing
```bash
# Test visitor recording
curl -X POST http://localhost:3000/api/visitor

# Check visitors.json
cat .data/visitors.json
```

### Integration Testing
- Mock IP extraction
- Mock geolocation service
- Test file operations
- Verify error handling

## Future Enhancements

### Database Migration
```typescript
// Replace file storage with database
// Example: Prisma, MongoDB, Redis
async function saveVisitor(visitor: VisitorData) {
  await db.visitor.upsert({
    where: { ip: visitor.ip },
    update: { /* ... */ },
    create: { /* ... */ }
  })
}
```

### Features
- Add rate limiting
- Implement bot detection
- Add referral tracking
- Track user agent
- Add session duration
- Implement data retention policy
- Add analytics dashboard
- Export to CSV/Excel

### Privacy
- Add consent management
- Implement anonymization
- Add data deletion endpoint
- Provide privacy policy page
- Implement GDPR compliance

### Performance
- Cache geolocation results
- Batch write operations
- Use message queue for writes
- Add read-through cache

## Monitoring

### Logs
```typescript
logger.error('[Visitor API] Error:', error)
```

### Metrics to Track
- Total unique visitors
- Visitors by country
- Visit frequency distribution
- Error rates
- Response times

## Related Files
- `@/lib/utils/ip-geolocation` - IP and geolocation utilities
- `@/lib/types/visitor` - Type definitions
- `@/lib/utils/logger` - Logging utility
- `.data/visitors.json` - Data storage (runtime generated)

## Notes
- **File-based storage**: Not recommended for production use
- **Static export incompatible**: API routes don't work with `output: 'export'`
- **Privacy implications**: Storing IP and location data requires disclosure
- **Concurrency**: Multiple simultaneous writes may cause data loss
- **No backup**: File-based data has no redundancy
