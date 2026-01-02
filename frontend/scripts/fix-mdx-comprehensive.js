const fs = require('fs');
const path = require('path');

/**
 * Comprehensive fix for all MDX issues
 */

// Fix remaining specific issues
const fixes = [
  {
    file: 'motor/motor_research.mdx',
    description: 'Fix <$50/kW',
    pattern: /<\$50\/kW/g,
    replacement: "{'<'}$50/kW"
  },
  {
    file: 'photography/manufacture_camera.mdx',
    description: 'Fix （<ms级）',
    pattern: /（<ms级）/g,
    replacement: "（{'<'}ms级）"
  },
  {
    file: 'computer/skill/zig.mdx',
    description: 'Fix Result<T,E>',
    pattern: /Result<T,E>/g,
    replacement: "Result{'<'}T,E{'>'}"
  }
];

// Files with \r in showTOC
const showTOCFiles = [
  'computer/skill/arch_linux.mdx',
  'computer/skill/powerful_open_source_softwares.mdx',
  'computer/software_engineering/refine.mdx',
];

// Files with extra pubDate field
const pubDateFiles = [
  'computer/skill/deep_learning_environment.mdx',
  'computer/skill/frontend_design_pattern.mdx',
  'computer/skill/mlflow.mdx',
  'computer/skill/pytorch_lightning.mdx',
  'computer/skill/train_deploy_pipeline.mdx',
];

function fixFile(filePath, pattern, replacement, description) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = content.replace(pattern, replacement);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${description}: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error ${description} ${filePath}:`, error.message);
    return false;
  }
}

function fixShowTOCWithCarriageReturn(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove \r from showTOC field
    content = content.replace(/showTOC:\s*"true\r"/g, 'showTOC: true');

    // Also normalize line endings
    content = content.replace(/\r\n/g, '\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed showTOC \\r: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing showTOC ${filePath}:`, error.message);
    return false;
  }
}

function removePubDateField(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove pubDate field
    content = content.replace(/\npubDate:\s*"[^"]*"\n/g, '\n');

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

// Run all fixes
console.log('🔧 Running comprehensive MDX fixes...\n');

let fixedCount = 0;

// Fix specific issues
for (const fix of fixes) {
  const fullPath = path.join('./data/blog', fix.file);
  if (fixFile(fullPath, fix.pattern, fix.replacement, fix.description)) {
    fixedCount++;
  }
}

// Fix showTOC \r issues
console.log('\n📝 Fixing showTOC carriage returns...\n');
for (const file of showTOCFiles) {
  const fullPath = path.join('./data/blog', file);
  if (fixShowTOCWithCarriageReturn(fullPath)) {
    fixedCount++;
  }
}

// Remove extra pubDate fields
console.log('\n📅 Removing extra pubDate fields...\n');
for (const file of pubDateFiles) {
  const fullPath = path.join('./data/blog', file);
  if (removePubDateField(fullPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Total fixes applied: ${fixedCount}`);
