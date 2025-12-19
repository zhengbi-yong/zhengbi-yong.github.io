-- Fix column name mismatches
-- Rename post_slug to slug in post_stats table
ALTER TABLE post_stats RENAME COLUMN post_slug TO slug;

-- Add slug column to comments table and populate it
ALTER TABLE comments ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update comments table to have slug column populated from post_slug
UPDATE comments SET slug = post_slug WHERE slug IS NULL;

-- Make slug column NOT NULL
ALTER TABLE comments ALTER COLUMN slug SET NOT NULL;

-- Drop the old post_slug column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'post_slug') THEN
        ALTER TABLE comments DROP COLUMN post_slug;
    END IF;
END $$;

-- Fix foreign key constraint to reference the correct column
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_slug_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_post_slug_fkey
    FOREIGN KEY (slug) REFERENCES post_stats(slug) ON DELETE CASCADE;

-- Update indexes to use the new slug column
DROP INDEX IF EXISTS idx_comments_post_created;
CREATE INDEX idx_comments_post_created ON comments(slug, created_at DESC);

DROP INDEX IF EXISTS idx_comments_post_status;
CREATE INDEX idx_comments_post_status ON comments(slug, status);