const fs = require('fs');
const path = require('path');

/**
 * Fix MDX files by escaping unescaped < characters in text content
 * Pattern: <digit> or <space> should be escaped to {'<'}
 * But we need to be careful not to escape:
 * - JSX tags like <Component>
 * - HTML tags like <div>, <span>
 * - Already escaped characters
 * - Code blocks
 */

const filesToFix = [
  'computer/high_performance_computing/cuda.mdx',
  'computer/high_performance_computing/nvcc.mdx',
  'motor/axial_flux_motor.mdx',
  'motor/coreless_motor_manufacture.mdx',
  'motor/cycloidal_pinwheel_reducer.mdx',
  'motor/humanoid_robot_motor_preference.mdx',
  'motor/motor_research.mdx',
  'motor/motor_test.mdx',
  'motor/reducer.mdx',
  'motor/rv_reducer.mdx',
  'motor/torque_sensor.mdx',
  'photography/camera.mdx',
  'photography/manufacture_camera.mdx',
  'robotics/digit360.mdx',
  'tactile/video_gathering.mdx',
];

function fixMDXFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix patterns like: <0.01mm, <100ms, <1弧分, <2kg
    // But NOT: <div, <span, <Component, <space (if followed by non-space)
    // Also NOT in code blocks (between ```)

    const lines = content.split('\n');
    let inCodeBlock = false;
    const fixedLines = [];

    for (let line of lines) {
      // Check if we're in a code block
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        fixedLines.push(line);
        continue;
      }

      if (inCodeBlock) {
        fixedLines.push(line);
        continue;
      }

      // Fix inline content (not in code blocks)
      // Pattern 1: <digit or <Chinese character followed by digit/letter
      // This matches things like: <0.01mm, <100ms, <1弧分, <2kg
      // But NOT: <div, <span, <Component (which are HTML/JSX tags)

      // First, let's escape < followed immediately by a digit or Chinese character
      // But NOT if it's part of an HTML/JSX tag
      line = line.replace(/(<)([0-9\u4e00-\u9fa5])/g, "{'<'}$2");

      // Also handle cases with spaces: < 100ms
      // But only if it's not an HTML tag
      line = line.replace(/(<)\s+([0-9])/g, "{'<'} $2");

      fixedLines.push(line);
    }

    content = fixedLines.join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
console.log('🔧 Starting MDX file fixes...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  const fullPath = path.join('./data/blog', file);
  if (fixMDXFile(fullPath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed ${fixedCount} out of ${filesToFix.length} files`);
