-- ============================================
-- CMS Core Tables Migration
-- ============================================
-- Creates the foundation for blog CMS functionality
-- Includes: posts, categories, tags, post_tags, post_versions, media
-- ============================================

-- Create post_status enum type
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived', 'scheduled');

-- ============================================
-- Categories Table (Hierarchical)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- ============================================
-- Tags Table (Flat)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tags
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_post_count ON tags(post_count DESC);

-- ============================================
-- Media Table (File Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for media
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_media_type ON media(media_type);
CREATE INDEX idx_media_created_at ON media(created_at DESC);
CREATE INDEX idx_media_deleted_at ON media(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- Posts Table (Core Content)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    summary TEXT,
    cover_image_id UUID REFERENCES media(id) ON DELETE SET NULL,
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    show_toc BOOLEAN NOT NULL DEFAULT TRUE,
    layout TEXT NOT NULL DEFAULT 'PostSimple',
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lastmod_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    reading_time INTEGER
);

-- Critical indexes for posts (admin queries)
CREATE INDEX idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_category_id ON posts(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author_id ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Composite index for admin listing
CREATE INDEX idx_posts_status_updated ON posts(status, updated_at DESC)
    WHERE deleted_at IS NULL;

-- ============================================
-- Post-Tags Junction Table (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);

-- Index for post_tags lookups
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- ============================================
-- Post Versions Table (Version History)
-- ============================================
CREATE TABLE IF NOT EXISTS post_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    change_log TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, version_number)
);

-- Index for version queries
CREATE INDEX idx_post_versions_post_id ON post_versions(post_id, version_number DESC);

-- ============================================
-- Triggers for Automatic Timestamp Updates
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_updated_at ON media;
CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration Complete
-- ============================================
