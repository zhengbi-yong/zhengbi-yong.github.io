const fs = require('fs');
const path = require('path');

/**
 * Add missing date fields to MDX files
 */

const filesWithoutDate = [
  'computer/skill/deep_learning_environment.mdx',
  'computer/skill/frontend_design_pattern.mdx',
  'computer/skill/mlflow.mdx',
  'computer/skill/pytorch_lightning.mdx',
  'computer/skill/train_deploy_pipeline.mdx',
  'computer/skill/zig.mdx',
];

function addDateToMDX(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if date field already exists
    if (content.match(/^date:\s*$/m)) {
      console.log(`⏭️  Already has date: ${filePath}`);
      return false;
    }

    // Find the frontmatter section (between --- and ---)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      console.log(`❌ No frontmatter found: ${filePath}`);
      return false;
    }

    const frontmatterEnd = frontmatterMatch.index + frontmatterMatch[0].length;
    const frontmatter = frontmatterMatch[1];

    // Add date field (use a default date)
    // Insert before the closing ---
    const dateLine = '\ndate: 2024-01-01\n';
    const newContent =
      content.slice(0, frontmatterEnd - 4) + // Up to the last --- (minus \n---)
      dateLine +
      content.slice(frontmatterEnd - 3); // From --- onwards

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added date: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
console.log('🔧 Adding missing date fields...\n');

let fixedCount = 0;
for (const file of filesWithoutDate) {
  const fullPath = path.join('./data/blog', file);
  if (addDateToMDX(fullPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Added dates to ${fixedCount} out of ${filesWithoutDate.length} files`);
