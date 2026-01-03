const { execSync } = require('child_process');

// Get module data
const output = execSync('ccw tool exec get_modules_by_depth \'{"format":"list"}\'', { encoding: 'utf8' });
const lines = output.trim().split('\n');

// Parse and group by layer
const layer3 = [];
const layer2 = [];
const layer1 = [];

for (const line of lines) {
  const depthMatch = line.match(/depth:(\d+)\|/);
  const pathMatch = line.match(/path:([^\|]+)\|/);

  if (!depthMatch || !pathMatch) continue;

  const depth = parseInt(depthMatch[1]);
  const path = pathMatch[1];

  if (depth >= 3) {
    layer3.push(path);
  } else if (depth === 1 || depth === 2) {
    layer2.push(path);
  } else if (depth === 0) {
    layer1.push(path);
  }
}

// Helper to create batches
function batch(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

// Create batches
const layer3Batches = batch(layer3, 4);
const layer2Batches = batch(layer2, 4);
const layer1Batches = batch(layer1, 4);

// Output as JSON for easy parsing
console.log(JSON.stringify({
  layer3: { total: layer3.length, batches: layer3Batches.length },
  layer2: { total: layer2.length, batches: layer2Batches.length },
  layer1: { total: layer1.length, batches: layer1Batches.length },
  layer3First: layer3Batches[0],
  layer2First: layer2Batches[0],
  layer1First: layer1Batches[0]
}, null, 2));
