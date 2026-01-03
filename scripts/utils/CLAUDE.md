# scripts/utils

## Purpose

Utility scripts for project maintenance, bundle analysis, configuration management, and development productivity.

## Core Components

### analyze-bundle.sh
**Purpose**: Analyze frontend bundle size and generate optimization report

**Usage**:
```bash
cd frontend
../scripts/utils/analyze-bundle.sh
```

**Process**:
```
1. Build project with ANALYZE=true flag
2. Generate bundle analysis in .next/analyze/
3. Display bundle summary:
   - Main chunks with sizes
   - Pages generated
   - Large chunk warnings (>100KB)
4. Provide recommendations
```

**Output**:
- Report: `.next/analyze/client.html` (interactive)
- Terminal summary with large chunk warnings

**Bundle Optimization Tips**:
- Code splitting for large chunks
- Dynamic imports for rarely used components
- Tree shaking to remove unused code
- Compression (gzip/brotli)

**Large Chunk Threshold**: 100KB (configurable in script)

### cleanup-project.sh
**Purpose**: Remove duplicate files and clean project structure after reorganization

**Scope**:
- Configuration files (.gitignore, eslint, prettier, etc.)
- Lock files (package-lock.json, pnpm-lock.yaml)
- TypeScript configs
- Build artifacts (.next, out, node_modules)
- Duplicate directories (app, components, layouts, lib)
- Temporary files (*.tmp, *.log)

**Cleanup Rules**:
```
1. Keep root configuration files
2. Remove frontend/backend duplicates
3. Keep frontend-specific configs (next.config.js, package.json)
4. Remove generated and cache directories
5. Remove duplicate source directories (if identical)
```

**Usage**:
```bash
./scripts/utils/cleanup-project.sh
```

**What Gets Cleaned**:

**Configuration Files**:
- Duplicate `.gitignore`
- Duplicate `eslint.config.mjs` / `.eslintrc.js`
- Duplicate `.prettierrc.js`
- Duplicate `.vscode/` directories
- Duplicate `tsconfig.json` / `jsconfig.json`
- Duplicate `tailwind.config.js`
- Duplicate `contentlayer.config.ts`

**Lock Files**:
- `package-lock.json` (keeping pnpm-lock.yaml)
- Duplicate `pnpm-lock.yaml`

**Build Artifacts**:
- `.next/` directories
- `out/` directories
- `node_modules/` (root only)
- `coverage/` directories
- `.cursor/` directories
- `.contentlayer/` cache

**Public Assets**:
- Duplicate `favicon.ico`
- Duplicate public folder assets

**Temporary Files**:
- `*.tmp`, `*.temp`, `*.log`
- `test-*.html`
- `debug-*.js`, `debug-*.log`

**Duplicate Directories**:
- Compares `app/`, `components/`, `layouts/`, `lib/`
- Removes root version if identical to frontend version
- Keeps version with more files/changes

**Safety Features**:
- Checks file/directory existence before removal
- Compares sizes before removing duplicates
- Preserves necessary configuration
- Summary report of all actions

**Output Summary**:
```
✓ One README.md in root
✓ One .gitignore in root
✓ One eslint configuration in root
✓ One prettier configuration in root
✓ One .vscode in root
✓ Frontend keeps its necessary configs
✓ Generated and cache files removed
✓ Duplicate scripts removed
✓ Duplicate directories removed
```

### config-manager.sh
**Purpose**: Manage environment configurations across different deployment environments

**Usage**:
```bash
./scripts/utils/config-manager.sh [command] [environment]
```

**Commands** (expected functionality):
- `validate`: Check configuration files
- `sync`: Synchronize configurations between environments
- `diff`: Show differences between environments
- `export`: Export configuration to secure format
- `import`: Import configuration from secure format

**Environments**:
- `development`: Local development
- `staging`: Pre-production testing
- `production`: Live deployment

**Note**: Script implementation should be verified for actual functionality

### fix-images.sh & test-images.sh
**Purpose**: Image optimization and testing utilities

**fix-images.sh**: Optimize and fix image issues
- Compress images
- Convert formats (WebP/AVIF)
- Fix broken links
- Update references

**test-images.sh**: Validate image integrity
- Check for broken images
- Verify optimization
- Test loading performance
- Generate reports

**Usage**:
```bash
./scripts/utils/fix-images.sh [directory]
./scripts/utils/test-images.sh [directory]
```

### test-local.sh
**Purpose**: Quick local testing and validation

**Usage**:
```bash
./scripts/utils/test-local.sh
```

**Functionality** (expected):
- Run local development server
- Execute basic smoke tests
- Check API connectivity
- Verify database connection
- Test core functionality

**Note**: Script implementation should be verified for actual functionality

### download-chemistry-deps.js
**Purpose**: Download dependencies for chemistry-related features (MDX plugins, rendering libraries)

**Usage**:
```bash
node scripts/utils/download-chemistry-deps.js
```

**Dependencies** (likely):
- KaTeX or MathJax for math rendering
- MDX plugins for chemistry notation
- Syntax highlighters
- Specialized markdown extensions

**Note**: Script implementation should be verified for actual functionality

## Common Workflows

### Initial Project Setup
```bash
# After project reorganization
./scripts/utils/cleanup-project.sh
```

### Before Deployment
```bash
# Analyze bundle size
cd frontend
../scripts/utils/analyze-bundle.sh

# Optimize if needed
# Fix images
../scripts/utils/fix-images.sh ./public
```

### Configuration Management
```bash
# Validate configurations
./scripts/utils/config-manager.sh validate production

# Sync environments
./scripts/utils/config-manager.sh sync development staging
```

### Testing and Quality
```bash
# Test images
./scripts/utils/test-images.sh ./public

# Run local tests
./scripts/utils/test-local.sh

# Download missing dependencies
node scripts/utils/download-chemistry-deps.js
```

## Integration Points

### Frontend Build
- `analyze-bundle.sh` integrates with Next.js build
- Requires `ANALYZE=true` environment variable
- Uses `@next/bundle-analyzer` plugin

### Project Structure
- `cleanup-project.sh` assumes monorepo structure
- Handles `frontend/` and `backend/` directories
- Preserves necessary configuration files

### Image Management
- Works with Next.js Image Optimization
- Processes images in `public/` directories
- Supports static asset optimization

## Error Handling

### Bundle Analysis Failures
**Issue**: No report generated
```bash
# Check Next.js build
cd frontend
pnpm build

# Verify bundle analyzer installed
pnpm list @next/bundle-analyzer

# Check ANALYZE environment
echo $ANALYZE
```

### Cleanup Script Errors
**Issue**: Files not found
```bash
# Verify current directory
pwd
# Should be project root

# Check permissions
ls -la frontend/
```

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/utils/*.sh
```

## Best Practices

### Bundle Optimization
1. Run bundle analysis before releases
2. Monitor bundle size over time
3. Set up size budgets in CI/CD
4. Use dynamic imports for code splitting
5. Lazy load heavy dependencies

### Project Cleanup
1. Run cleanup after structural changes
2. Review summary before committing
3. Test builds after cleanup
4. Keep essential configurations
5. Document cleanup reasons

### Configuration Management
1. Never commit production secrets
2. Use environment variables for sensitive data
3. Validate configurations before deployment
4. Keep documentation up to date
5. Use version control for config changes

### Image Optimization
1. Optimize images before adding to repo
2. Use modern formats (WebP, AVIF)
3. Implement responsive images
4. Lazy load below-fold images
5. Monitor image sizes regularly

## Troubleshooting

### Bundle Analysis Not Working
```bash
# Check next.config.js
cat frontend/next.config.js | grep bundleAnalyzer

# Install dependency
cd frontend
pnpm add -D @next/bundle-analyzer

# Rebuild
ANALYZE=true pnpm build
```

### Cleanup Removed Needed Files
```bash
# Restore from git
git checkout HEAD -- frontend/.eslintrc.js

# Or from specific commit
git checkout <commit-hash> -- path/to/file
```

### Configuration Issues
```bash
# Validate syntax
node -e "console.log(require('./.env.production'))"

# Check for missing variables
grep -r "NEXT_PUBLIC_" frontend/.env.production
```

## Scripts Maintenance

### Adding New Utilities
1. Place in `scripts/utils/`
2. Make executable: `chmod +x script-name.sh`
3. Add documentation to this CLAUDE.md
4. Test thoroughly before deployment
5. Update usage examples

### Script Dependencies
- Bash 4.0+ for shell scripts
- Node.js for JavaScript utilities
- pnpm for package management
- Docker for container-based operations

## Future Enhancements

### Planned Additions
- [ ] Automated dependency updater
- [ ] Security vulnerability scanner
- [ ] Performance benchmarking script
- [ ] Database migration helper
- [ ] Docker cleanup utility
- [ ] Log aggregation tool

### Improvements
- [ ] Add script documentation headers
- [ ] Implement dry-run modes
- [ ] Add progress indicators
- [ ] Create interactive menus
- [ ] Add rollback capabilities

## See Also

- `./scripts/operations/` - Operations and deployment scripts
- `./scripts/dev/` - Development utilities
- `./frontend/next.config.js` - Next.js configuration
- `./frontend/package.json` - Frontend dependencies
- `./.github/workflows/` - CI/CD automation
