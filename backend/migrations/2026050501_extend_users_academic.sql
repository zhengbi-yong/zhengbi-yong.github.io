-- ============================================
-- Platform Transformation Phase 1: Extend Users Table with Academic Fields
-- ============================================

BEGIN;

-- 1. display_name: 显示名称（可不同于 username）
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
COMMENT ON COLUMN users.display_name IS '显示名称 — 学术名片上的姓名';

-- 2. institution: 所属机构/大学
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution TEXT;
COMMENT ON COLUMN users.institution IS '所属机构 — 学校/研究所/公司';

-- 3. research_fields: 研究领域数组
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_fields TEXT[] DEFAULT '{}';
COMMENT ON COLUMN users.research_fields IS '研究领域 — 标签数组，支持多领域';

-- 4. orcid_id: ORCID 学术身份标识
ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid_id TEXT;
COMMENT ON COLUMN users.orcid_id IS 'ORCID iD — 全球唯一学术标识符';
-- ORCID 对活跃用户唯一（软删除友好）
DROP INDEX IF EXISTS idx_users_orcid_active;
CREATE UNIQUE INDEX idx_users_orcid_active ON users (orcid_id) WHERE deleted_at IS NULL AND orcid_id IS NOT NULL;

-- 5. google_scholar: Google Scholar 主页
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_scholar TEXT;
COMMENT ON COLUMN users.google_scholar IS 'Google Scholar 个人主页链接';

-- 6. academic_bio: 学术简介（长文本）
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_bio TEXT;
COMMENT ON COLUMN users.academic_bio IS '学术个人简介 — 研究方向/成果概述';

-- 7. avatar_url: 头像 URL（从 profile JSONB 提升为列）
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN users.avatar_url IS '头像 URL';

-- 8. website: 个人主页（从 profile JSONB 提升为列）
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
COMMENT ON COLUMN users.website IS '个人主页 URL';

-- 9. 为研究领域创建 GIN 索引（加速领域匹配/推荐）
CREATE INDEX IF NOT EXISTS idx_users_research_fields ON users USING GIN (research_fields);

-- 10. 为机构创建索引（加速同机构学者发现）
CREATE INDEX IF NOT EXISTS idx_users_institution ON users (institution) WHERE deleted_at IS NULL AND institution IS NOT NULL;

COMMIT;

-- 验证
SELECT
    'users' as table_name,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_users,
    COUNT(*) FILTER (WHERE orcid_id IS NOT NULL) as with_orcid,
    COUNT(*) FILTER (WHERE institution IS NOT NULL) as with_institution
FROM users;
