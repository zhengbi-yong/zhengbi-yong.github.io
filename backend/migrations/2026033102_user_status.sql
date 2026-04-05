-- Add status column to users table for account management
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'banned'));

-- Add index for status-based queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
