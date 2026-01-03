const fs = require('fs');

// Module data from previous command
const moduleData = `depth:7|path:./frontend/src/app/admin/posts/show/[slug]|files:2|types:[md,tsx]|has_claude:yes
depth:7|path:./frontend/src/app/tags/[tag]/page/[page]|files:2|types:[md,tsx]|has_claude:yes
depth:6|path:./frontend/src/app/admin/monitoring/health|files:2|types:[md,tsx]|has_claude:yes
depth:6|path:./frontend/src/app/admin/monitoring/metrics|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./backend/crates/api/src/metrics|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/middleware|files:4|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/routes|files:15|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/utils|files:2|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/e2e|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/helpers|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/security|files:2|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/unit|files:6|types:[rs]|has_claude:no
depth:5|path:./backend/crates/db/src/models|files:1|types:[rs]|has_claude:no
depth:5|path:./backend/crates/shared/src/middleware|files:2|types:[rs]|has_claude:no
depth:5|path:./deployments/server/monitoring/grafana/dashboards|files:3|types:[json,yml]|has_claude:no
depth:5|path:./deployments/server/monitoring/grafana/datasources|files:1|types:[yml]|has_claude:no
depth:5|path:./frontend/src/app/admin/analytics|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/comments|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/monitoring|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts-refine|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts-simple|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/settings|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/test|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/users|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/users-refine|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/api/newsletter|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/api/visitor|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/api/visitors|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/music/[name]|files:3|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/tags/[tag]|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/components/media/Image|files:2|types:[md]|has_claude:yes
depth:5|path:./frontend/src/components/navigation/TableOfContents|files:6|types:[tsx,ts]|has_claude:no
depth:5|path:./frontend/src/components/shadcn/ui|files:14|types:[tsx]|has_claude:no
depth:5|path:./frontend/src/components/ui/Skeleton|files:3|types:[tsx,md]|has_claude:no
depth:5|path:./frontend/src/components/ui/Toast|files:1|types:[md]|has_claude:no
depth:5|path:./frontend/src/lib/store/core|files:4|types:[ts,md]|has_claude:yes
depth:4|path:./backend/crates/api/src|files:5|types:[rs]|has_claude:no
depth:4|path:./backend/crates/api/tests|files:10|types:[rs]|has_claude:no
depth:4|path:./backend/crates/core/src|files:3|types:[rs]|has_claude:no
depth:4|path:./backend/crates/db/src|files:2|types:[rs]|has_claude:no
depth:4|path:./backend/crates/shared/src|files:6|types:[rs]|has_claude:no
depth:4|path:./backend/crates/worker/src|files:1|types:[rs]|has_claude:no
depth:4|path:./deployments/docker/compose-files/backend|files:4|types:[yml]|has_claude:no
depth:4|path:./deployments/docker/images/export|files:5|types:[tar]|has_claude:no
depth:4|path:./deployments/server/monitoring/alerts|files:1|types:[yml]|has_claude:no
depth:4|path:./docs/deployment/guides/docker|files:5|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/low-resource|files:4|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/scripts|files:1|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/server|files:5|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/backend-development|files:1|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/frontend-development|files:1|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/testing|files:2|types:[md]|has_claude:no
depth:4|path:./frontend/slidev/hardware/components|files:4|types:[vue]|has_claude:no
depth:4|path:./frontend/slidev/hardware/images|files:17|types:[png]|has_claude:no
depth:4|path:./frontend/slidev/hardware/pages|files:1|types:[md]|has_claude:no
depth:4|path:./frontend/slidev/hardware/snippets|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/slidev/hardware/videos|files:3|types:[mp4]|has_claude:no
depth:4|path:./frontend/src/app/about|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/admin|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/analytics|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/excalidraw|files:3|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/experiment|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/music|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/offline|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/projects|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/simple-test|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/tags|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/visitors|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/admin|files:6|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/animations|files:18|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/audio|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/auth|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/book|files:5|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/charts|files:7|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/components/chemistry|files:7|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/components/debug|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/Excalidraw|files:2|types:[css,tsx]|has_claude:no
depth:4|path:./frontend/src/components/header|files:6|types:[tsx,md]|has_claude:no
depth:4|path:./frontend/src/components/home|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/hooks|files:10|types:[ts]|has_claude:no
depth:4|path:./frontend/src/components/layouts|files:10|types:[tsx,md]|has_claude:yes
depth:4|path:./frontend/src/components/lib|files:2|types:[md,ts]|has_claude:yes
depth:4|path:./frontend/src/components/loaders|files:11|types:[tsx,md,ts]|has_claude:yes
depth:4|path:./frontend/src/components/magazine|files:9|types:[tsx,md]|has_claude:yes
depth:4|path:./frontend/src/components/maps|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/MDXComponents|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/post|files:6|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/search|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/sections|files:11|types:[tsx,css]|has_claude:no
depth:4|path:./frontend/src/components/seo|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/social-icons|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/three|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/ui|files:7|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/lib/api|files:2|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/cache|files:3|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/db|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/hooks|files:4|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/providers|files:4|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/lib/security|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/store|files:7|types:[ts,md]|has_claude:no
depth:4|path:./frontend/src/lib/types|files:5|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/ui|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/utils|files:22|types:[ts]|has_claude:no
depth:4|path:./frontend/src/locales/en|files:1|types:[json]|has_claude:no
depth:4|path:./frontend/src/locales/zh-CN|files:1|types:[json]|has_claude:no
depth:4|path:./frontend/src/payload/collections|files:6|types:[ts]|has_claude:no
depth:4|path:./frontend/tests/app/admin|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/providers|files:5|types:[ts,tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/security|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/utils|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-3dmol|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-api|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-chemistry|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-chemistry-debug|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-health-page|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-molecule-id|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-rkit-mol|files:1|types:[tsx]|has_claude:no
depth:4|path:./scripts/archive/migrate_mdx_crate/src|files:1|types:[rs]|has_claude:no
depth:3|path:./backend/.github/workflows|files:1|types:[yml]|has_claude:no
depth:3|path:./backend/crates/api|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/core|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/db|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/shared|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/worker|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/scripts/data|files:7|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/database|files:2|types:[sh,sql]|has_claude:no
depth:3|path:./backend/scripts/deployment|files:3|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/development|files:3|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/openapi|files:1|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/testing|files:7|types:[ps1,sh]|has_claude:no
depth:3|path:./config/environments/backend|files:1|types:[example]|has_claude:no
depth:3|path:./deployments/docker/compose-files|files:5|types:[yml]|has_claude:no
depth:3|path:./deployments/nginx/backend-specific|files:1|types:[conf]|has_claude:no
depth:3|path:./deployments/nginx/conf.d|files:1|types:[conf]|has_claude:no
depth:3|path:./deployments/server/monitoring|files:1|types:[yml]|has_claude:no
depth:3|path:./deployments/server/package|files:2|types:[sh,md]|has_claude:no
depth:3|path:./deployments/server/setup|files:4|types:[production,conf,md]|has_claude:no
depth:3|path:./docs/archive/migration|files:3|types:[md]|has_claude:no
depth:3|path:./docs/archive/operations|files:3|types:[md]|has_claude:no
depth:3|path:./docs/deployment/archive|files:5|types:[md]|has_claude:no
depth:3|path:./docs/deployment/best-practices|files:5|types:[md]|has_claude:no
depth:3|path:./docs/deployment/concepts|files:4|types:[md]|has_claude:no
depth:3|path:./docs/deployment/getting-started|files:4|types:[md]|has_claude:no
depth:3|path:./docs/deployment/guides|files:1|types:[md]|has_claude:no
depth:3|path:./docs/deployment/reference|files:6|types:[md]|has_claude:no
depth:3|path:./docs/development/archive|files:7|types:[md]|has_claude:no
depth:3|path:./docs/development/best-practices|files:5|types:[md]|has_claude:no
depth:3|path:./docs/development/concepts|files:3|types:[md]|has_claude:no
depth:3|path:./docs/development/getting-started|files:2|types:[md]|has_claude:no
depth:3|path:./docs/development/operations|files:3|types:[md]|has_claude:no
depth:3|path:./docs/development/reference|files:2|types:[md]|has_claude:no
depth:3|path:./docs/guides/technical|files:3|types:[md]|has_claude:no
depth:3|path:./frontend/data/authors|files:1|types:[mdx]|has_claude:no
depth:3|path:./frontend/scripts/dev|files:2|types:[bat,sh]|has_claude:no
depth:3|path:./frontend/scripts/generate|files:4|types:[js,sh,mjs]|has_claude:no
depth:3|path:./frontend/scripts/test|files:3|types:[ps1,sh]|has_claude:no
depth:3|path:./frontend/slidev/hardware|files:5|types:[json,yaml,md,css,ts]|has_claude:no
depth:3|path:./frontend/src/app|files:11|types:[tsx,ts,json]|has_claude:no
depth:3|path:./frontend/src/components|files:73|types:[tsx,css]|has_claude:no
depth:3|path:./frontend/src/lib|files:16|types:[ts,tsx]|has_claude:no
depth:3|path:./frontend/src/mocks|files:2|types:[ts]|has_claude:no
depth:3|path:./frontend/src/styles|files:2|types:[css]|has_claude:no
depth:3|path:./frontend/styles/tokens|files:3|types:[css]|has_claude:no
depth:3|path:./scripts/archive/migrate_mdx_crate|files:1|types:[toml]|has_claude:no
depth:3|path:./scripts/data/sync|files:4|types:[nu,ps1,sh]|has_claude:no
depth:2|path:./.github/workflows|files:5|types:[yml]|has_claude:no
depth:2|path:./backend/.cargo|files:1|types:[toml]|has_claude:no
depth:2|path:./backend/.sqlx|files:59|types:[json,toml]|has_claude:no
depth:2|path:./backend/migrations|files:9|types:[sql]|has_claude:no
depth:2|path:./backend/openapi|files:1|types:[json]|has_claude:no
depth:2|path:./backend/scripts|files:10|types:[ps1,sh]|has_claude:no
depth:2|path:./config/environments|files:7|types:[example]|has_claude:no
depth:2|path:./deployments/config|files:1|types:[json]|has_claude:no
depth:2|path:./deployments/nginx|files:1|types:[conf]|has_claude:no
depth:2|path:./deployments/scripts|files:2|types:[sh]|has_claude:no
depth:2|path:./docs/appendix|files:3|types:[md]|has_claude:no
depth:2|path:./docs/archive|files:1|types:[md]|has_claude:no
depth:2|path:./docs/configuration|files:1|types:[md]|has_claude:no
depth:2|path:./docs/deployment|files:3|types:[md]|has_claude:no
depth:2|path:./docs/development|files:3|types:[md]|has_claude:no
depth:2|path:./docs/getting-started|files:9|types:[md]|has_claude:no
depth:2|path:./docs/guides|files:6|types:[md]|has_claude:no
depth:2|path:./docs/migration|files:1|types:[md]|has_claude:no
depth:2|path:./docs/operations|files:3|types:[md]|has_claude:no
depth:2|path:./docs/reference|files:4|types:[md,json]|has_claude:no
depth:2|path:./docs/testing|files:8|types:[md]|has_claude:no
depth:2|path:./frontend/.husky|files:1|types:[]|has_claude:no
depth:2|path:./frontend/data|files:9|types:[ts,svg,bib,js]|has_claude:no
depth:2|path:./frontend/e2e|files:4|types:[ts]|has_claude:no
depth:2|path:./frontend/scripts|files:8|types:[js]|has_claude:no
depth:2|path:./frontend/src|files:1|types:[bak]|has_claude:no
depth:2|path:./frontend/tests|files:8|types:[js,bat,md,ts,html]|has_claude:no
depth:2|path:./frontend/types|files:7|types:[ts]|has_claude:no
depth:2|path:./scripts/archive|files:2|types:[py,sh]|has_claude:no
depth:2|path:./scripts/backup|files:2|types:[sh]|has_claude:no
depth:2|path:./scripts/data|files:4|types:[mjs]|has_claude:no
depth:2|path:./scripts/deployment|files:20|types:[ps1,sh,js]|has_claude:no
depth:2|path:./scripts/dev|files:6|types:[bat,sh,ps1]|has_claude:no
depth:2|path:./scripts/export|files:2|types:[py,sh]|has_claude:no
depth:2|path:./scripts/operations|files:4|types:[sh]|has_claude:no
depth:2|path:./scripts/testing|files:3|types:[ps1]|has_claude:no
depth:2|path:./scripts/utils|files:9|types:[sh,py,mjs,js]|has_claude:no
depth:1|path:./.github|files:2|types:[yml]|has_claude:no
depth:1|path:./.husky|files:2|types:[]|has_claude:no
depth:1|path:./backend|files:12|types:[example,lock,toml,md,bat]|has_claude:no
depth:1|path:./config|files:1|types:[yml]|has_claude:no
depth:1|path:./docs|files:4|types:[md]|has_claude:no
depth:1|path:./frontend|files:23|types:[local,json,ts,curl-only,md,js,bak,yaml,tsbuildinfo]|has_claude:no
depth:1|path:./scripts|files:9|types:[nu,ps1,sh,md]|has_claude:no
depth:0|path:.|files:14|types:[sh,bat,json,js,py,md]|has_claude:no`;

// Parse modules
const modules = [];
const lines = moduleData.split('\n').filter(line => line.trim());

for (const line of lines) {
  const parts = line.split('|');
  const module = {};
  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex !== -1) {
      const key = part.substring(0, colonIndex);
      const value = part.substring(colonIndex + 1);
      module[key] = value;
    }
  }
  modules.push({
    path: module.path,
    depth: parseInt(module.depth),
    files: parseInt(module.files),
    has_claude: module.has_claude === 'yes'
  });
}

// Group by layer
const layers = {
  1: [], // depth 0
  2: [], // depth 1-2
  3: []  // depth ≥3
};

for (const module of modules) {
  if (module.depth >= 3) {
    layers[3].push(module);
  } else if (module.depth >= 1) {
    layers[2].push(module);
  } else {
    layers[1].push(module);
  }
}

// Create batches (4 modules per batch)
function createBatches(modules, size = 4) {
  const batches = [];
  for (let i = 0; i < modules.length; i += size) {
    batches.push(modules.slice(i, i + size));
  }
  return batches;
}

const batches = {
  3: createBatches(layers[3]),
  2: createBatches(layers[2]),
  1: createBatches(layers[1])
};

// Save execution plan
const plan = {
  summary: {
    total_modules: modules.length,
    layer3: layers[3].length,
    layer2: layers[2].length,
    layer1: layers[1].length,
    total_batches: batches[3].length + batches[2].length + batches[1].length
  },
  batches: batches
};

fs.writeFileSync('update_plan.json', JSON.stringify(plan, null, 2));

console.log(`Execution plan created:`);
console.log(`- Layer 3 (depth ≥3): ${layers[3].length} modules → ${batches[3].length} batches`);
console.log(`- Layer 2 (depth 1-2): ${layers[2].length} modules → ${batches[2].length} batches`);
console.log(`- Layer 1 (depth 0): ${layers[1].length} modules → ${batches[1].length} batches`);
console.log(`- Total: ${plan.summary.total_batches} batches`);
