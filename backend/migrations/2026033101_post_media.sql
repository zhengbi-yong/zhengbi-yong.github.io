-- Post-Media junction table for tracking which media items are used in which posts
CREATE TABLE post_media (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, media_id)
);
CREATE INDEX idx_post_media_media ON post_media(media_id);
