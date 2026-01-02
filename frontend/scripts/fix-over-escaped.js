const fs = require('fs');
const path = require('path');

/**
 * Fix over-escaped characters in motor_research.mdx
 * The fix scripts escaped some comparisons that shouldn't be escaped
 */

function fixMotorResearchFile() {
  const filePath = './data/blog/motor/motor_research.mdx';

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix over-escaped comparisons in technical specifications
    // These are in list items and don't need escaping in the list context
    const fixes = [
      { pattern: /跳动: {'<'}0\.03mm/g, replacement: '跳动: <0.03mm' },
      { pattern: /热漏{'<'}0\.1W\/kA/g, replacement: '热漏<0.1W/kA' },
      { pattern: /漏热{'<'}0\.1W\/m²/g, replacement: '漏热<0.1W/m²' },
      { pattern: /漏热{'<'}0\.5W\/支/g, replacement: '漏热<0.5W/支' },
      { pattern: /1kW{'<'}0\.2W\/kg/g, replacement: '1kW<0.2W/kg' },
      { pattern: /真空度: {'<'}10⁻⁴/g, replacement: '真空度: <10⁻⁴' },
    ];

    for (const fix of fixes) {
      content = content.replace(fix.pattern, fix.replacement);
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Fixed motor_research.mdx over-escaped characters');

      // Show what was changed
      const lines = content.split('\n');
      console.log('\nFixed lines:');
      for (const fix of fixes) {
        const match = content.match(fix.replacement);
        if (match) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          console.log(`  Line ${lineNum}: ${match[0]}`);
        }
      }
      return true;
    } else {
      console.log('⏭️  No changes needed for motor_research.mdx');
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing motor_research.mdx:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing motor_research.mdx over-escaped characters...\n');
fixMotorResearchFile();
console.log('\n✨ Fix complete');
