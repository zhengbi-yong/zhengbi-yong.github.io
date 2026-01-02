const fs = require('fs');
const path = require('path');

/**
 * Final comprehensive fix for remaining MDX issues
 */

const remainingFixes = [
  {
    file: 'motor/motor_research.mdx',
    fixes: [
      {
        pattern: /<\$50\/kA·m/g,
        replacement: "{'<'}$50/kA·m",
        desc: 'Fix <$50/kA·m'
      }
    ]
  },
  {
    file: 'photography/manufacture_camera.mdx',
    fixes: [
      {
        pattern: /预算<\$1,000/g,
        replacement: "预算{'<'}$1,000",
        desc: 'Fix 预算<$1,000'
      }
    ]
  }
];

// All files with pubDate that need to be removed
const allPubDateFiles = [
  'computer/skill/deep_learning_environment.mdx',
  'computer/skill/frontend_design_pattern.mdx',
  'computer/skill/mlflow.mdx',
  'computer/skill/pytorch_lightning.mdx',
  'computer/skill/train_deploy_pipeline.mdx',
  'computer/skill/zig.mdx',
];

function applyFixes(filePath, fixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const fix of fixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  ✅ ${fix.desc}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}\n`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function removePubDate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove pubDate line in any format
    content = content.replace(/\n*pubDate:\s*[^\n]*\n*/g, '\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Removed pubDate: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error removing pubDate ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Running final MDX fixes...\n');

let fixedCount = 0;

// Apply remaining fixes
console.log('Fixing remaining character issues:\n');
for (const fix of remainingFixes) {
  const fullPath = path.join('./data/blog', fix.file);
  if (applyFixes(fullPath, fix.fixes)) {
    fixedCount++;
  }
}

// Remove all pubDate fields
console.log('\nRemoving all pubDate fields:\n');
for (const file of allPubDateFiles) {
  const fullPath = path.join('./data/blog', file);
  if (removePubDate(fullPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Total fixes applied: ${fixedCount}`);
