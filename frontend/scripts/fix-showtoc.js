const fs = require('fs');
const path = require('path');

/**
 * Fix showTOC field - remove \r characters
 */

const filesWithShowTOCIssue = [
  'computer/skill/arch_linux.mdx',
  'computer/skill/powerful_open_source_softwares.mdx',
  'computer/software_engineering/refine.mdx',
];

function fixShowTOC(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace showTOC: "true\r" with showTOC: true
    content = content.replace(/showTOC:\s*"true\\r"/g, 'showTOC: true');
    content = content.replace(/showTOC:\s*"true\\r"\s*/g, 'showTOC: true\n');

    // Also handle any other \r in showTOC field
    content = content.replace(/(showTOC:\s*)\r\n/g, '$1true\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed showTOC: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No showTOC issue: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
console.log('🔧 Fixing showTOC fields...\n');

let fixedCount = 0;
for (const file of filesWithShowTOCIssue) {
  const fullPath = path.join('./data/blog', file);
  if (fixShowTOC(fullPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed ${fixedCount} out of ${filesWithShowTOCIssue.length} files`);
