const fs = require('fs');
const { execSync } = require('child_process');

// Load execution plan
const plan = JSON.parse(fs.readFileSync('update_plan.json', 'utf8'));

// Tool fallback order
const toolOrder = ['gemini', 'qwen', 'codex'];

// Function to update a single module
function updateModule(modulePath, strategy, layer) {
  const strategyStr = strategy === 'multi-layer' ? 'multi-layer' : 'single-layer';

  for (const tool of toolOrder) {
    try {
      console.log(`  → Updating ${modulePath} (Layer ${layer}) with ${tool} (${strategyStr} strategy)...`);

      const command = `cd "${modulePath}" && ccw tool exec update_module_claude '{"strategy":"${strategyStr}","path":".","tool":"${tool}"}'`;
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });

      console.log(`  ✅ ${modulePath} updated with ${tool}`);
      return { success: true, tool, path: modulePath };
    } catch (error) {
      console.log(`  ⚠️  ${modulePath} failed with ${tool}, trying next...`);
      // Continue to next tool
    }
  }

  console.log(`  ❌ FAILED: ${modulePath} - all tools exhausted`);
  return { success: false, tool: null, path: modulePath };
}

// Function to process a batch
function processBatch(batch, layer) {
  const results = [];

  for (const module of batch) {
    const strategy = module.depth >= 3 ? 'multi-layer' : 'single-layer';
    const result = updateModule(module.path, strategy, layer);
    results.push(result);
  }

  return results;
}

// Main execution function
async function executeLayer(layerNum) {
  const batches = plan.batches[layerNum];
  if (!batches || batches.length === 0) {
    console.log(`No batches for Layer ${layerNum}, skipping...`);
    return [];
  }

  console.log(`\n========================================`);
  console.log(`Starting Layer ${layerNum} (${batches.length} batches)`);
  console.log(`========================================\n`);

  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(`\n--- Batch ${i + 1}/${batches.length} ---`);
    const batchResults = processBatch(batches[i], layerNum);
    allResults.push(...batchResults);
  }

  console.log(`\nLayer ${layerNum} completed:`);
  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);

  // Tool usage stats
  const toolStats = {};
  for (const result of allResults) {
    if (result.success && result.tool) {
      toolStats[result.tool] = (toolStats[result.tool] || 0) + 1;
    }
  }
  console.log(`  Tool usage:`, toolStats);

  return allResults;
}

// Execute all layers
async function main() {
  console.log('Starting full documentation update...\n');

  const allResults = {
    3: await executeLayer(3),
    2: await executeLayer(2),
    1: await executeLayer(1)
  };

  // Final summary
  console.log('\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================');

  let totalSuccess = 0;
  let totalFailed = 0;
  const totalToolStats = {};

  for (const layerNum of [3, 2, 1]) {
    const results = allResults[layerNum];
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    totalSuccess += successCount;
    totalFailed += failCount;

    for (const result of results) {
      if (result.success && result.tool) {
        totalToolStats[result.tool] = (totalToolStats[result.tool] || 0) + 1;
      }
    }
  }

  console.log(`Total: ${totalSuccess + totalFailed} | Success: ${totalSuccess} | Failed: ${totalFailed}`);
  console.log(`Tool usage:`, totalToolStats);

  if (totalFailed > 0) {
    console.log('\nFailed modules:');
    for (const layerNum of [3, 2, 1]) {
      const failed = allResults[layerNum].filter(r => !r.success);
      if (failed.length > 0) {
        console.log(`  Layer ${layerNum}:`);
        for (const f of failed) {
          console.log(`    - ${f.path}`);
        }
      }
    }
  }

  // Save results
  fs.writeFileSync('update_results.json', JSON.stringify(allResults, null, 2));
  console.log('\nResults saved to update_results.json');
}

// Run
main().catch(console.error);
