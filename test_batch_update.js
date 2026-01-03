const fs = require('fs');

// Load execution plan
const plan = JSON.parse(fs.readFileSync('update_plan.json', 'utf8'));

// Test with first 3 batches of Layer 3
const testBatches = plan.batches[3].slice(0, 3);

console.log(`Testing with ${testBatches.length} batches from Layer 3...`);
console.log(`Total modules in test: ${testBatches.reduce((sum, batch) => sum + batch.length, 0)}`);

// Save test batches
fs.writeFileSync('test_batches.json', JSON.stringify(testBatches, null, 2));

console.log('\nTest batches saved to test_batches.json');
console.log('Batches:');
testBatches.forEach((batch, i) => {
  console.log(`  Batch ${i + 1}:`);
  batch.forEach(m => {
    console.log(`    - ${m.path} (depth ${m.depth}, ${m.files} files)`);
  });
});
