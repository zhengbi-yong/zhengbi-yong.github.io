-- Create outbox_events table for reliable async event processing
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_outbox_events_pending 
    ON outbox_events (created_at) 
    WHERE processed_at IS NULL AND retry_count < 3;

CREATE INDEX IF NOT EXISTS idx_outbox_events_type 
    ON outbox_events (event_type, created_at) 
    WHERE processed_at IS NULL;

COMMENT ON TABLE outbox_events IS 'Outbox pattern table for reliable async event processing';
