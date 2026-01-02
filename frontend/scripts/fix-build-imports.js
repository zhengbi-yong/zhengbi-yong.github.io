const fs = require('fs');
const path = require('path');

/**
 * Fix remaining build import issues after src/ migration
 */

const fixes = [
  // Fix @/layouts/ -> @/components/layouts/
  {
    pattern: /from '@\/layouts\//g,
    replacement: "from '@/components/layouts/",
    desc: "Fix @/layouts/ imports"
  },
  // Fix css/ -> @/styles/
  {
    pattern: /from 'css\//g,
    replacement: "from '@/styles/",
    desc: "Fix css/ imports"
  },
  // Fix app/seo -> @/app/seo
  {
    pattern: /from 'app\/seo'/g,
    replacement: "from '@/app/seo'",
    desc: "Fix app/seo imports"
  },
  // Fix app/tag-data.json -> @/app/tag-data.json
  {
    pattern: /from 'app\/tag-data\.json'/g,
    replacement: "from '@/app/tag-data.json'",
    desc: "Fix app/tag-data.json imports"
  },
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const fix of fixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  ✅ ${fix.desc}: ${filePath}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  let updated = 0;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      updated += processDirectory(fullPath);
    } else if (file.match(/\.(tsx|ts|jsx|js)$/)) {
      if (fixImportsInFile(fullPath)) {
        updated++;
      }
    }
  });

  return updated;
}

console.log('🔧 Fixing build imports...\n');
const updated = processDirectory('./src');
console.log(`\n✨ Total files updated: ${updated}`);
