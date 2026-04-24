-- Normalize the original outbox schema from 0001_initial.sql to the
-- async-worker schema used by the API and worker services.
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    locked_at TIMESTAMPTZ,
    locked_by TEXT
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'topic'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'event_type'
    ) THEN
        ALTER TABLE outbox_events RENAME COLUMN topic TO event_type;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'attempts'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE outbox_events RENAME COLUMN attempts TO retry_count;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'last_error'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'error'
    ) THEN
        ALTER TABLE outbox_events RENAME COLUMN last_error TO error;
    END IF;
END $$;

ALTER TABLE outbox_events
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS error TEXT,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outbox_events'
          AND column_name = 'status'
    ) THEN
        UPDATE outbox_events
        SET processed_at = COALESCE(processed_at, created_at)
        WHERE processed_at IS NULL
          AND status <> 'pending';
    END IF;
END $$;

ALTER TABLE outbox_events
    ALTER COLUMN event_type TYPE VARCHAR(100),
    ALTER COLUMN event_type SET NOT NULL,
    ALTER COLUMN payload SET DEFAULT '{}'::jsonb,
    ALTER COLUMN payload SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN retry_count SET DEFAULT 0,
    ALTER COLUMN retry_count SET NOT NULL;

DROP INDEX IF EXISTS idx_outbox_pending;

CREATE INDEX IF NOT EXISTS idx_outbox_events_pending
    ON outbox_events (created_at)
    WHERE processed_at IS NULL AND retry_count < 3;

CREATE INDEX IF NOT EXISTS idx_outbox_events_type
    ON outbox_events (event_type, created_at)
    WHERE processed_at IS NULL;

COMMENT ON TABLE outbox_events IS 'Outbox pattern table for reliable async event processing';
