ALTER TABLE outbox_events
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by TEXT;

CREATE INDEX IF NOT EXISTS idx_outbox_events_claimable
    ON outbox_events (created_at, locked_at)
    WHERE processed_at IS NULL AND retry_count < 3;
