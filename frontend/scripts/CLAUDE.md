# Frontend Scripts Directory

## Purpose
Build automation, code generation, and data migration utilities for the frontend.

## Directory Structure

```
frontend/scripts/
├── build/                # Build-related scripts
├── dev/                  # Development utilities
├── generate/             # Code generation
├── test/                 # Test scripts
├── fix-build-imports.js           # Fix import paths in build
├── fix-mdx.js                     # MDX content fixes
├── fix-mdx-comprehensive.js       # Comprehensive MDX fixes
├── fix-mdx-final.js               # Final MDX issue fixes
├── fix-missing-dates.js           # Add missing dates to frontmatter
├── fix-over-escaped.js            # Fix over-escaped characters
├── fix-showtoc.js                 # Fix showTOC frontmatter
└── update-imports.js              # Update import statements
```

## Script Categories

### 1. Build Scripts
**Location**: `build/`

**Purpose**: Compile, bundle, and optimize frontend code

**Usage**: Invoked via npm scripts:
```bash
pnpm build
pnpm build:profile  # With build profiling
```

### 2. Development Scripts
**Location**: `dev/`

**Purpose**: Development server and tooling

**Usage**:
```bash
pnpm dev
pnpm dev:debug
```

### 3. Code Generation
**Location**: `generate/`

**Files**:
- `generate-api-types.js` - Generate TypeScript types from API

**Usage**:
```bash
pnpm generate:types
```

### 4. Data Migration Scripts

#### MDX Fix Scripts

**fix-mdx.js**
- Fixes basic MDX syntax issues
- Handles JSX in Markdown
- Escaping corrections

**fix-mdx-comprehensive.js**
- Comprehensive MDX issue resolution
- Multiple pattern matching
- Batch processing

**fix-mdx-final.js**
```javascript
// Fixes specific issues:
// - <$50/kA·m → {'<'}$50/kA·m
// - 预算<$1,000 → 预算{'<'}$1,000
// - Removes pubDate from frontmatter
```

**fix-missing-dates.js**
- Adds missing `date` fields to frontmatter
- Uses file modification time as fallback
- Validates date formats

**fix-showtoc.js**
- Standardizes `showTOC` frontmatter
- Converts various formats to boolean
- Removes inconsistent values

**fix-over-escaped.js**
- Fixes over-escaped HTML entities
- Corrects character encoding issues
- Restores proper MDX syntax

**fix-build-imports.js**
- Fixes import paths for build output
- Adjusts relative imports
- Resolves module resolution issues

**update-imports.js**
- Updates import statements to new paths
- Migrates to new directory structure
- Handles alias updates

## Script Execution

### Running Individual Scripts
```bash
node frontend/scripts/fix-mdx-final.js
node frontend/scripts/update-imports.js
```

### NPM Script Integration
```json
{
  "scripts": {
    "fix:mdx": "node scripts/fix-mdx-final.js",
    "fix:imports": "node scripts/update-imports.js",
    "generate:types": "node scripts/generate/generate-api-types.js"
  }
}
```

## Common Patterns

### File Processing Pattern
```javascript
const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Apply fixes
  content = content.replace(/pattern/, 'replacement');
  fs.writeFileSync(filePath, content, 'utf8');
}
```

### Batch Processing Pattern
```javascript
const files = [
  'path/to/file1.mdx',
  'path/to/file2.mdx',
];

files.forEach(file => {
  processFile(file);
  console.log(`✅ Fixed: ${file}`);
});
```

## Maintenance

### Adding New Scripts
1. Create script file in appropriate subdirectory
2. Add shebang for executable scripts: `#!/usr/bin/env node`
3. Make executable: `chmod +x scripts/new-script.sh`
4. Add npm script shortcut if frequently used

### Script Documentation
Each script should include:
- Purpose comment at top
- Usage examples
- Expected inputs/outputs
- Side effects (file modifications, etc.)

### Safety Precautions
- **Backup**: Scripts should backup before modifying
- **Dry-run**: Optional flag to preview changes
- **Logging**: Clear progress messages
- **Error Handling**: Try-catch blocks with clear errors

## Related Modules
- `frontend/data/blog/` - MDX content being fixed
- `contentlayer.config.js` - Content processing
- `frontend/lib/mdx-runtime.ts` - MDX rendering
