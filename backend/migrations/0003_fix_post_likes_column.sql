-- Rename post_slug to slug in post_likes table
ALTER TABLE post_likes RENAME COLUMN post_slug TO slug;

-- Update indexes
DROP INDEX IF EXISTS idx_post_likes_post;
CREATE INDEX idx_post_likes_post ON post_likes(slug);