-- Phase 4.4: Soft delete support and partial unique indexes for users

-- Add deleted_at if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Drop old non-partial indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;

-- Drop CITEXT UNIQUE constraints if they exist as separate constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_name = 'users_email_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_email_key;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_name = 'users_username_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_username_key;
    END IF;
END;
$$;

-- Partial unique indexes: only enforce uniqueness for active (non-deleted) users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
    ON users (email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_active
    ON users (username) WHERE deleted_at IS NULL;

-- Fix JSONB index to use jsonb_path_ops for better operator support
DROP INDEX IF EXISTS idx_users_profile_gin;
CREATE INDEX idx_users_profile_gin ON users USING GIN (profile jsonb_path_ops);
