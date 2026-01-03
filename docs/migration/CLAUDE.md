# Migration Documentation

## Purpose
Documents system migration procedures, version upgrades, and data transformation processes.

## Directory Structure

```
docs/migration/
└── payload-cms-migration.md    # Contentlayer → Payload CMS 3.0 migration
```

## Content Scope

### Documented Migrations
- **Payload CMS 3.0 Migration**: Contentlayer MDX → Payload CMS complete transition
  - Phase 1-7: Implementation status
  - Phase 8: Testing procedures
  - Rollback plans
  - Success criteria

### Migration Types
1. **Content Migration**
   - MDX files to database
   - Frontmatter parsing and transformation
   - Tag/category relationship mapping

2. **System Migration**
   - CMS platform replacement
   - Database schema changes
   - API endpoint updates

3. **Configuration Migration**
   - Docker networking
   - Environment variables
   - Build processes

## Key Information

### Payload CMS Migration Status
- **Status**: Core functionality 95% complete, testing pending
- **Scope**: 143 MDX articles
- **Collections**: 6 collections defined (Posts, Authors, Tags, Categories, Media, Users)
- **New Files**: 20 files created
- **Modified Files**: 3 files updated

### Rollback Procedures
**Immediate Rollback** (5 min):
```bash
git checkout HEAD~1 key files
pnpm install && pnpm build
```

**Full Rollback** (30 min):
```bash
rm Payload-related files
git checkout HEAD~10 package.json
pnpm install && pnpm build
```

## Implementation Details

### Collections Schema
- **Posts**: title, slug, content, authors, tags, categories, draft status, ISR hooks
- **Authors**: name, bio, avatar, social links
- **Tags**: name, slug, auto-generated
- **Categories**: name, slug, auto-generated
- **Media**: upload config, image sizes, focal point
- **Users**: authentication, roles, Gravatar integration

### Special Features Preserved
- Chemical equation rendering (KaTeX + mhchem)
- Math formula support
- MDX component syntax
- ISR (Incremental Static Regeneration)

## Known Issues

1. **Payload CLI Import**: Bypassed using Next.js dev server
2. **TypeScript Errors**: Partial `// @ts-ignore` workarounds
3. **Lexical Integration**: Chemical formula nodes partial
4. **Port Conflicts**: Detection and resolution pending

## Related Modules
- `frontend/payload.config.ts` - Payload configuration
- `frontend/src/collections/` - Collection definitions
- `docs/guides/` - User guides for new system
- `docs/operations/` - Operational procedures
