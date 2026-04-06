# Team Members Data Management & Admin Panel

**Date**: 2026-04-06
**Status**: Approved for Implementation

## Context

The team page currently uses static TypeScript data (`frontend/data/teamData.ts`) with no editing capability. Team members cannot be added, modified, or deleted through the UI. Additionally, the team member data structure is not compatible with the user system, making future integration difficult.

**Goal**: Implement database-backed team member management with an admin panel, compatible with the existing user system for future seamless linking.

## Architecture

```
Frontend (Next.js)              Backend (Rust/Axum)           Storage
├── Team Page (read)       ──►  ├── team_members table  ──►  MinIO
│   (API fetch)                 │   (PostgreSQL)             │
└── Admin Panel             ──►  └── Media System            │
    /admin/team                  (existing)                      │
```

## Database Schema

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),  -- nullable, for future linking
    
    -- Name fields
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    
    -- Role (advisor/lead/member)
    team_role VARCHAR(50) NOT NULL DEFAULT 'member',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Profile fields
    title VARCHAR(255),
    bio TEXT,
    affiliation VARCHAR(255),
    research_tags TEXT[],
    
    -- Contact (when not linked to user)
    email VARCHAR(255),
    github VARCHAR(100),
    website VARCHAR(500),
    
    -- Avatar and gallery (media IDs, managed via existing media system)
    avatar_media_id UUID REFERENCES media(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_role ON team_members(team_role);
CREATE INDEX idx_team_members_display_order ON team_members(display_order);
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/team-members` | List all active team members (public, ordered) |
| GET | `/api/v1/team-members/{id}` | Get single team member (public) |
| POST | `/api/v1/admin/team-members` | Create team member (admin only) |
| PUT | `/api/v1/admin/team-members/{id}` | Update team member (admin only) |
| DELETE | `/api/v1/admin/team-members/{id}` | Soft delete / deactivate (admin only) |
| POST | `/api/v1/admin/team-members/{id}/gallery` | Upload gallery image |
| DELETE | `/api/v1/admin/team-members/{id}/gallery/{media_id}` | Remove gallery image |

## Implementation Steps

### Phase 1: Backend

1. Create database migration `xxxx_add_team_members.sql`
2. Create model in `backend/crates/db/src/models/team_member.rs`
3. Create API routes in `backend/crates/api/src/routes/team_members.rs`
4. Register routes in `backend/crates/api/src/main.rs`
5. Verify with `cargo check`

### Phase 2: Frontend Types & API

1. Add `TeamMember` type to `frontend/src/lib/types/backend.ts`
2. Add team API methods to `frontend/src/lib/api/backend.ts`
3. Update `frontend/src/app/team/page.tsx` to fetch from API

### Phase 3: Admin Panel

1. Create `frontend/src/app/admin/team/page.tsx` (list view)
2. Create `frontend/src/app/admin/team/new/page.tsx` (create form)
3. Create `frontend/src/app/admin/team/[id]/edit/page.tsx` (edit form)

## Key Files

### Backend (New)
- `backend/crates/db/src/models/team_member.rs`
- `backend/crates/api/src/routes/team_members.rs`
- `backend/migrations/xxxx_add_team_members.sql`

### Backend (Modified)
- `backend/crates/api/src/main.rs` (register routes)

### Frontend (New)
- `frontend/src/app/admin/team/page.tsx`
- `frontend/src/app/admin/team/new/page.tsx`
- `frontend/src/app/admin/team/[id]/edit/page.tsx`

### Frontend (Modified)
- `frontend/src/lib/types/backend.ts`
- `frontend/src/lib/api/backend.ts`
- `frontend/src/app/team/page.tsx`

## Verification

1. Backend: `cargo check --workspace`
2. Frontend: `pnpm tsc --noEmit`
3. Run migrations: `cd backend && cargo run -p blog-migrator`
4. Start services and verify:
   - `GET /api/v1/team-members` returns data
   - `/admin/team` page loads with form
   - Team page at `/team` displays members from API

## Dependencies

- Uses existing media system for avatar/gallery uploads
- Uses existing auth middleware for admin routes
- Follows existing patterns for models, routes, and admin pages
