-- Insert test categories
INSERT INTO categories (id, slug, name, description, display_order, post_count) VALUES
('00000000-0000-0000-0000-000000000002', 'robotics', 'Robotics', 'ROS, control systems', 2, 0),
('00000000-0000-0000-0000-000000000003', 'mathematics', 'Mathematics', 'Linear algebra', 3, 0),
('00000000-0000-0000-0000-000000000004', 'chemistry', 'Chemistry', 'Molecular visualization', 4, 0),
('00000000-0000-0000-0000-000000000005', 'tactile-sensing', 'Tactile Sensing', 'Research papers', 5, 0)
ON CONFLICT (slug) DO NOTHING;

-- Insert test tags
INSERT INTO tags (id, slug, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'nextjs', 'Next.js', 'Next.js framework'),
('00000000-0000-0000-0000-000000000002', 'rust', 'Rust', 'Rust language'),
('00000000-0000-0000-0000-000000000003', 'tutorial', 'Tutorial', 'Tutorials'),
('00000000-0000-0000-0000-000000000004', 'research', 'Research', 'Research papers')
ON CONFLICT (slug) DO NOTHING;

-- Verify counts
SELECT 'categories' as type, COUNT(*) as count FROM categories
UNION ALL
SELECT 'tags' as type, COUNT(*) as count FROM tags
UNION ALL
SELECT 'posts' as type, COUNT(*) as count FROM posts;
