-- Add B-tree index on posts.title for fast exact-match lookups (title -> slug bidirectional query).
-- The existing GIN trigram index (idx_posts_title_trgm) is optimized for fuzzy/substring search,
-- but B-tree is significantly faster for exact equality: WHERE title = 'exact title'.
-- Partial index excludes soft-deleted rows for smaller index size and faster scans.
CREATE INDEX IF NOT EXISTS idx_posts_title_exact
  ON posts (title)
  WHERE deleted_at IS NULL;
