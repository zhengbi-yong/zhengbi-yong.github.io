-- Phase 4.1: UUIDv7 Migration
-- Adds uuid_generate_v7() function and updates DEFAULT values for major tables
-- NOTE: Only changes DEFAULT, does not modify existing data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PL/pgSQL implementation of UUIDv7 (time-ordered UUID)
-- Compatible with PostgreSQL 17 (no pg_uuidv7 extension required)
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS UUID AS $$
DECLARE
    unix_ms BIGINT;
    hex     TEXT;
BEGIN
    unix_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    hex := lpad(to_hex(unix_ms), 12, '0')
        || '7'
        || lpad(to_hex(floor(random() * 4096)::INT), 3, '0')
        || lpad(to_hex(floor(random() * 4)::INT | 8), 1, '0')  -- variant bits 10xx
        || lpad(to_hex(floor(random() * 68719476736)::BIGINT), 12, '0');
    RETURN (
        substring(hex, 1, 8) || '-' ||
        substring(hex, 9, 4) || '-' ||
        substring(hex, 13, 4) || '-' ||
        substring(hex, 17, 4) || '-' ||
        substring(hex, 21, 12)
    )::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update DEFAULT values for major tables
ALTER TABLE users          ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE comments       ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE team_members   ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE outbox_events  ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE refresh_tokens ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- posts, categories, tags, media, post_versions, reading_progress, search_keywords, search_history: update if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        ALTER TABLE posts ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE categories ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        ALTER TABLE tags ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
        ALTER TABLE media ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_versions') THEN
        ALTER TABLE post_versions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_progress') THEN
        ALTER TABLE reading_progress ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_keywords') THEN
        ALTER TABLE search_keywords ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') THEN
        ALTER TABLE search_history ALTER COLUMN id SET DEFAULT uuid_generate_v7();
    END IF;
END;
$$;
