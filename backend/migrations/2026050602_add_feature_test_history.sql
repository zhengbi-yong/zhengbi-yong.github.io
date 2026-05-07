-- Feature test history — snapshots of each automated test run
-- Stores aggregate pass/fail counts + detailed results as JSONB
CREATE TABLE IF NOT EXISTS feature_test_history (
    id SERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    results JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_test_history_run_at ON feature_test_history(run_at DESC);
