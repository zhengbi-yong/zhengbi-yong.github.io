const fs = require('fs');
const path = require('path');

// Import path replacements for src/ structure
// NOTE: tsconfig.json paths already handle the src/ prefix, so we don't add it here
// We only need to update the old paths (like @/layouts, @/css) to new locations
const replacements = [
  // Layouts (special case - moving to components/layouts)
  { from: /from '@\/layouts\//g, to: "from '@/components/layouts/" },
  { from: /from "@\/layouts\//g, to: 'from "@/components/layouts/' },

  // CSS (renamed to styles)
  { from: /from '@\/css\//g, to: "from '@/styles/" },
  { from: /from "@\/css\//g, to: 'from "@/styles/' },

  // Hooks (moving to lib/hooks)
  { from: /from '@\/hooks\//g, to: "from '@/lib/hooks/" },
  { from: /from "@\/hooks\//g, to: 'from "@/lib/hooks/' },

  // Types (moving to lib/types)
  { from: /from '@\/types\//g, to: "from '@/lib/types/" },
  { from: /from "@\/types\//g, to: 'from "@/lib/types/' },

  // Remove incorrect @/src/ prefixes if they exist
  { from: /from '@\/src\//g, to: "from '@/" },
  { from: /from "@\/src\//g, to: 'from "@/' },
];

function updateImportsInFile(filePath, dryRun = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      const regex = new RegExp(from, 'g');
      const newContent = content.replace(regex, to);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    });

    if (modified && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir, dryRun = false) {
  let updated = 0;

  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!file.includes('node_modules') &&
              !file.includes('.next') &&
              !file.includes('.turbo') &&
              !file.includes('out') &&
              !file.includes('dist')) {
            updated += processDirectory(fullPath, dryRun);
          }
        } else if (file.match(/\.(tsx|ts|jsx|js)$/)) {
          if (updateImportsInFile(fullPath, dryRun)) {
            updated++;
            console.log(`Would update: ${fullPath}`);
          }
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return updated;
}

const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
  console.log('Scanning for imports that need updating...\n');
}

console.log('🚀 Starting import path update for src/ migration\n');
console.log('Replacements:');
replacements.forEach(({ from, to }) => {
  console.log(`  ${from.source} → ${to}`);
});
console.log('');

const updated = processDirectory('./', dryRun);

console.log(`\n✨ Analysis complete!`);
console.log(`Total files that ${dryRun ? 'would be' : 'were'} updated: ${updated}`);

if (dryRun) {
  console.log('\n💡 To apply changes, run without --dry-run flag:');
  console.log('   node scripts/update-imports.js');
}
