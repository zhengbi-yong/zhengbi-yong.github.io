# WebSocket Collaboration Architecture (Phase 4)

## Overview

This document describes the real-time collaboration architecture for the TipTap editor using Hocuspocus + Yjs + TipTap 3. This is a **local development / demo** implementation. Production deployment is out of scope.

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Next.js Frontend (Port 3001)                   │   │
│  │  ┌─────────────────┐      ┌──────────────────────────────────────┐   │   │
│  │  │ Collaboration   │      │         TipTap Editor                 │   │   │
│  │  │ Editor Wrapper │ ───► │  ┌────────────────────────────────┐  │   │   │
│  │  │                │      │  │  HocuspocusProvider             │  │   │   │
│  │  │ (loads         │      │  │  (WebSocket client)             │  │   │   │
│  │  │  TiptapEditor  │      │  └──────────────┬───────────────────┘  │   │   │
│  │  │  with collab   │      │                 │                     │   │   │
│  │  │  room ID)      │      │                 ▼                     │   │   │
│  │  └─────────────────┘      │  ┌────────────────────────────────┐  │   │   │
│  │                             │  │  Collaboration Extension       │  │   │   │
│  │                             │  │  (binds to Y.Doc)             │  │   │   │
│  │                             │  └──────────────┬───────────────────┘  │   │   │
│  │                             │                 │                     │   │   │
│  │                             │                 ▼                     │   │   │
│  │                             │  ┌────────────────────────────────┐  │   │   │
│  │                             │  │  Y.Doc (Yjs document)          │  │   │   │
│  │                             │  │  - In-memory CRDT state       │  │   │   │
│  │                             │  │  - Synced via WebSocket        │  │   │   │
│  │                             │  └────────────────────────────────┘  │   │   │
│  │                             └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ WebSocket (ws://localhost:3002)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Hocuspocus Server (Port 3002)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  @hocuspocus/server                                                  │   │
│  │                                                                       │   │
│  │  - Manages WebSocket connections                                      │   │
│  │  - Routes to named rooms (documentName = roomId)                     │   │
│  │  - Yjs document sync (in-memory, Phase 1)                             │   │
│  │  - Awareness protocol (cursor positions, user presence)              │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  In-Memory Document Store                                        │ │   │
│  │  │  - Map<documentName, Y.Doc>                                    │ │   │
│  │  │  - Documents persist as long as server runs                      │ │   │
│  │  │  - No database persistence in Phase 1                            │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP (unchanged)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Axum Backend (Port 3000)                              │
│  - REST API (unchanged)                                                      │
│  - No WebSocket handling for collaboration                                  │
│  - Persistence via existing Payload/PostgreSQL                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Component Inventory

### 2.1 Hocuspocus Server (`frontend/scripts/hocuspocus-server.js`)

**Purpose**: Standalone WebSocket server for Yjs document synchronization

**Details**:
- Runs as separate Node.js process (not in Next.js)
- Listens on `ws://localhost:3002`
- No persistence — all documents held in memory
- Handles concurrent editing via Yjs CRDT merge

**Key Callbacks**:
| Callback | Purpose |
|----------|---------|
| `onConnect` | Log new client connections |
| `onDisconnect` | Log client disconnections |
| `onLoadDocument` | Return Y.Doc for named room (in-memory) |
| `onStoreDocument` | No-op in Phase 1 |

### 2.2 Yjs Document (`yjs` package)

**Purpose**: CRDT-based shared document state

**Details**:
- One `Y.Doc` per collaboration room
- Contains all editor state as Yjs types (Y.XmlFragment for ProseMirror)
- Changes merge automatically via CRDT algorithm

### 2.3 HocuspocusProvider (`@hocuspocus/provider`)

**Purpose**: TipTap ↔ Hocuspocus WebSocket client bridge

**Details**:
- Browser-side WebSocket client
- Connects to `ws://localhost:3002`
- Syncs `Y.Doc` changes bidirectionally
- Handles reconnection automatically

**Constructor Parameters**:
```typescript
new HocuspocusProvider({
  url: 'ws://localhost:3002',  // WebSocket server URL
  name: 'room-123',            // Document/room name
  document: ydoc,              // Y.Doc instance to sync
})
```

### 2.4 Collaboration Extension (`@tiptap/extension-collaboration`)

**Purpose**: Binds TipTap editor to Yjs document

**Details**:
- Configured with a `Y.Doc` instance
- Replaces TipTap's native history with Yjs UndoManager
- All editor changes go through Yjs for sync

## 3. Connection Flow Sequence

```
User A opens collaboration editor (room: "doc-123")
User B opens collaboration editor (room: "doc-123")

1. Editor initializes
   └── Creates Y.Doc()
   └── Creates HocuspocusProvider({ name: "doc-123", document: ydoc })
   └── HocuspocusProvider connects to ws://localhost:3002

2. Hocuspocus Server receives connection
   └── onConnect(data) callback fires
   └── Looks up "doc-123" in memory store
   └── If exists: sends existing Y.Doc state to new client
   └── If not: creates new Y.Doc, stores in memory

3. Yjs sync begins
   └── HocuspocusProvider receives document state
   └── Updates local Y.Doc
   └── TipTap's Collaboration extension sees Y.Doc changes
   └── TipTap re-renders with merged content

4. Concurrent editing (CRDT merge)
   └── User A types "Hello"
   └── User B types "World" (at same position)
   └── Yjs CRDT merges: "HelloWorld" or "WorldHello"
   └── Both editors update automatically

5. User disconnects
   └── onDisconnect(data) callback fires
   └── Y.Doc remains in server memory
   └── New connections receive current state
```

## 4. Document Persistence Strategy

### Phase 1 (Current — Local Dev/Demo)
- **Storage**: In-memory only
- **Lifetime**: Document lives as long as Hocuspocus server runs
- **Server restart**: All documents lost
- **Use case**: Local development, demos, testing

### Phase 2 (Future — Database Persistence)
- Implement `onStoreDocument` callback
- Persist Y.Doc encoded state to PostgreSQL
- Load document on `onLoadDocument`
- Considerations:
  - Encode Y.Doc as binary (Y.encodeStateAsUpdate)
  - Store in a dedicated `collaboration_documents` table
  - Handle conflicts withlamport clocks

### Phase 3 (Future — Production)
- Use Hocuspocus with database extension
- Consider Redis for multi-instance deployment
- Add authentication/authorization per room
- Implement document versioning/snapshots

## 5. Known Limitations

### Current Phase (Phase 1)
1. **No persistence**: Server restart loses all documents
2. **Single server only**: No horizontal scaling
3. **No authentication**: Anyone can join any room
4. **No authorization**: Any client can modify any document
5. **Memory bound**: Unlimited documents could exhaust RAM
6. **No undo/redo sync**: Yjs UndoManager works locally only

### TipTap 3.x Compatibility
- `@tiptap/extension-collaboration@3.22.4` is compatible with TipTap 3.20.4
- `yjs@13.6.30` installed (peer dep satisfied)
- `@hocuspocus/provider@4.0.0` installed (compatible)
- `@hocuspocus/server@4.0.0` installed (compatible with Node.js 22.x)

## 6. Startup Commands

```bash
# Terminal 1: Start Next.js frontend
cd frontend && pnpm dev

# Terminal 2: Start Hocuspocus WebSocket server
cd frontend && pnpm collaboration:server

# Or run both in background
```

## 7. File Structure

```
frontend/
├── scripts/
│   └── hocuspocus-server.js          # WebSocket server (NEW)
├── src/
│   └── components/
│       └── editor/
│           ├── TiptapEditor.tsx       # Modified: conditional collaboration
│           └── CollaborationEditor.tsx # Wrapper component (NEW)
└── package.json                       # Modified: added scripts
```

## 8. Next Steps

1. **Test locally**: Open two browser tabs with same room ID
2. **Add awareness**: Show cursor positions of other users
3. **Persist documents**: Implement database storage in Phase 2
4. **Add authentication**: JWT-based room access control
5. **Production deployment**: Use Hocuspocus with proper infrastructure
