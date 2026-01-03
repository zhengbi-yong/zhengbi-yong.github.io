# User Guides Documentation

## Purpose
Comprehensive user guides for blog system operation, content creation, and administration.

## Directory Structure

```
docs/guides/
├── README.md                    # Guide index and navigation
├── writing-guide.md            # Markdown/MDX writing guidelines
├── content-management.md       # Content creation and management
├── admin-panel.md              # Admin panel usage
├── frontend-backend-guide.md   # API integration guide
├── quick-reference.md          # Common commands reference
└── technical/                  # Technical guides
    ├── README.md
    ├── chemistry-visualization-setup.md
    └── testing-guide.md
```

## Content Types

### User Guides (Chinese + English)
- **Content Creation**: Writing workflows, MDX syntax, backup strategies
- **Administration**: User management, comment moderation, post statistics
- **Integration**: API usage, frontend-backend communication
- **Reference**: Command quick reference, keyboard shortcuts

### Technical Guides
- Chemistry 3D visualization setup
- Testing strategies and tools
- Component development patterns

## Key Features

### Audience-Based Navigation
- **Content Creators**: Writing → Content Management → Admin Panel
- **Developers**: Frontend-Backend Guide → Writing Guide → Technical Guides
- **Administrators**: Admin Panel → Content Management → Quick Reference

### Bilingual Format
All guides maintain Chinese (primary) and English translations for accessibility.

### Integration Points
- Links to `../quick-start.md` for getting started
- References to `../development/` for technical docs
- Connects to `../deployment/` for operational guides
- Points to `../reference/` for detailed specifications

## Maintenance Notes

### Guide Dependencies
- Writing guide assumes Contentlayer MDX setup
- Admin panel guide requires backend API running
- Technical guides may reference feature flags

### Update Workflow
1. Update feature-specific guides when functionality changes
2. Keep README.md table of contents synchronized
3. Maintain bilingual consistency across updates
4. Cross-link related guides for better discoverability

### Common Patterns
- Time estimates for each guide (15-30 min reading)
- Difficulty ratings (⭐⭐⭐⭐⭐)
- Quick task tables for common operations
- Related documentation sections

## Related Modules
- `docs/migration/` - Data migration procedures
- `docs/operations/` - Operational procedures
- `docs/reference/` - Technical specifications
- `frontend/src/app/admin/` - Admin panel implementation
