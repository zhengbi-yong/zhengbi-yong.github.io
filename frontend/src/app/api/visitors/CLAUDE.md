# Visitors API Module

## Overview

This module provides a REST API endpoint for retrieving visitor statistics data. It serves as a simple data access layer that reads visitor information from a runtime JSON file and returns it in a structured format.

**Purpose**: Expose visitor analytics data to the frontend application
**Pattern**: Dynamic API Route with file-based data storage
**Layer**: Layer 2 - API Route Handler

## Module Structure

```
frontend/src/app/api/visitors/
└── route.ts              # API route handler (GET /api/visitors)
```

## Architecture

### Data Flow

```
Frontend Request
    ↓
GET /api/visitors
    ↓
Read .data/visitors.json from filesystem
    ↓
Parse JSON data
    ↓
Return NextResponse with visitor array
```

### Components

**route.ts** (25 lines)
- **Handler**: `GET()` - Retrieves all visitor data
- **Data Source**: `.data/visitors.json` by default
- **Error Handling**: Returns empty array on file read errors
- **Runtime Execution**: `dynamic = 'force-dynamic'` - evaluated on each request

## API Specification

### GET /api/visitors

**Response** (Success - 200):
```json
{
  "visitors": [
    {
      "ip": "8.8.8.8",
      "country": "United States",
      "city": "Mountain View",
      "lat": 37.4056,
      "lon": -122.0775,
      "timezone": "America/Los_Angeles",
      "firstVisit": "2026-03-22T10:00:00.000Z",
      "lastVisit": "2026-03-22T10:05:00.000Z",
      "visitCount": 2
    }
  ]
}
```

**Response** (Error - 200):
```json
{
  "visitors": []
}
```

**Note**: Errors are handled gracefully - file not found or parse errors return empty array instead of throwing

## Data Models

### VisitorData

```typescript
interface VisitorData {
  ip: string
  country: string
  city: string
  lat: number
  lon: number
  timezone: string
  firstVisit: string
  lastVisit: string
  visitCount: number
}
```

Location: `@/lib/types/visitor`

## Error Handling

1. **File Not Found**: Returns `{ visitors: [] }` instead of 404
2. **Parse Error**: Returns `{ visitors: [] }` on invalid JSON
3. **No Exceptions**: All errors caught and converted to safe responses

## Constraints & Limitations

- **Dynamic Only**: `force-dynamic` keeps the response in sync with live runtime data
- **File-based**: Data lives in `.data/visitors.json` unless overridden by env vars
- **No Real-time Push**: Updates still require a new request; there is no WebSocket/SSE stream
- **Write Operations**: Not supported (GET only)
- **Size Limit**: Entire file loaded into memory (no pagination)

## Dependencies

### Internal
- `@/lib/types/visitor` - TypeScript type definitions

### External
- `next/server` - Next.js API utilities (NextResponse)
- `fs/promises` - File system operations
- `path` - Path manipulation

## Runtime Configuration

```typescript
export const dynamic = 'force-dynamic'
```

This configuration:
- Forces runtime execution
- Returns live JSON data from the current server instance
- Avoids build-time freezing of visitor analytics

## Usage Examples

### Frontend Integration

```typescript
// Fetch visitor data
async function getVisitorData() {
  const response = await fetch('/api/visitors')
  const data = await response.json()
  return data.visitors as VisitorData[]
}

// Usage in component
const visitors = await getVisitorData()
console.log(`Total visitors: ${visitors.length}`)
```

### Data Source

The `visitors.json` file is auto-created at runtime when it does not exist:

```json
{
  "visitors": [
    {
      "id": "uuid-1",
      "timestamp": 1735929600000,
      "path": "/",
      "referrer": "https://google.com",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "country": "US",
        "device": "desktop"
      }
    }
  ]
}
```

## Integration Points

1. **Data Generation**: `POST /api/visitor` populates `.data/visitors.json` at runtime
2. **Frontend Components**: Blog pages, dashboard, analytics views consume this API
3. **Storage Mount**: Production deployments should mount `/app/.data` to preserve data across container restarts

## Testing Considerations

- Test with missing `.data/visitors.json` file
- Test with invalid JSON content
- Test with empty visitors array
- Verify runtime read/write behavior under container restarts
- Test response format matches TypeScript types

## Future Enhancements

- Add pagination for large datasets
- Support filtering by date range
- Add caching headers
- Implement data aggregation endpoints
- Support POST for tracking visits (if server-side execution enabled)

## Related Modules

- `@/app/` - Pages that consume visitor data
- `@/lib/types/visitor` - Shared type definitions
- `@/data/` - Static data sources

## Maintenance Notes

- **File Location**: `.data/visitors.json` by default, configurable through `VISITOR_DATA_DIR` / `VISITORS_FILE`
- **Deployment**: Mount `/app/.data` in production if visitor history should persist across redeploys
- **Type Safety**: Keep `VisitorData` interface in sync with actual data structure
- **Error Handling**: All errors handled gracefully - no exceptions thrown
