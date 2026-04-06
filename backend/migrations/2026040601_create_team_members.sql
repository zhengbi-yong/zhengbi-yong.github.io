-- Team Members table for lab team management
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

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

    -- Avatar media ID (managed via existing media system)
    avatar_media_id UUID REFERENCES media(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_role ON team_members(team_role);
CREATE INDEX idx_team_members_display_order ON team_members(display_order);
CREATE INDEX idx_team_members_active ON team_members(is_active) WHERE is_active = true;
