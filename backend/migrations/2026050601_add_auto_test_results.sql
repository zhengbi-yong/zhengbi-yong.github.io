-- Auto-test results table for automated feature testing
CREATE TABLE IF NOT EXISTS auto_test_results (
    id SERIAL PRIMARY KEY,
    feature_id VARCHAR(10) NOT NULL UNIQUE,
    feature_name VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT false,
    response_time_ms INTEGER,
    error_message TEXT,
    tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_test_feature_id ON auto_test_results(feature_id);
CREATE INDEX IF NOT EXISTS idx_auto_test_status ON auto_test_results(status);
CREATE INDEX IF NOT EXISTS idx_auto_test_tested_at ON auto_test_results(tested_at);
