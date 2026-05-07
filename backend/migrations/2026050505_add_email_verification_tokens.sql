-- Migration: 2026050505_add_email_verification_tokens
-- Purpose: Add table for email verification tokens and corresponding index

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Index for fast lookup by token hash
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(token_hash);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at)
    WHERE used_at IS NULL;

-- Only one active verification token per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_active_user
    ON email_verification_tokens(user_id)
    WHERE used_at IS NULL;
