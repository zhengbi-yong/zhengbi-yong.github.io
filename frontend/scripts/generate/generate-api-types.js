const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function generateTypes() {
  const frontendRoot = path.resolve(__dirname, '..', '..');
  const openApiPath = path.join(frontendRoot, 'openapi.json');
  const outputPath = path.join(
    frontendRoot,
    'src',
    'lib',
    'types',
    'openapi-generated.ts'
  );

  console.log('Generating TypeScript types from OpenAPI specification...');
  console.log(`  Input: ${openApiPath}`);
  console.log(`  Output: ${outputPath}`);

  if (!fs.existsSync(openApiPath)) {
    console.error(`OpenAPI spec not found at: ${openApiPath}`);
    console.error('Run `cargo run --bin export_openapi` in the backend first.');
    process.exit(1);
  }

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const openapiTypescriptCli = path.join(
      frontendRoot,
      'node_modules',
      'openapi-typescript',
      'bin',
      'cli.js'
    );

    if (!fs.existsSync(openapiTypescriptCli)) {
      console.error(
        `openapi-typescript CLI is not installed at: ${openapiTypescriptCli}`
      );
      console.error('Run `pnpm install` in the frontend first.');
      process.exit(1);
    }

    const result = spawnSync(
      process.execPath,
      [openapiTypescriptCli, openApiPath, '-o', outputPath],
      {
        cwd: frontendRoot,
        stdio: 'inherit',
      }
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }

    const generatedTypes = fs.readFileSync(outputPath, 'utf8');
    const lineCount = generatedTypes.split(/\r?\n/).length;

    console.log('TypeScript types generated successfully.');
    console.log(`  Lines written: ${lineCount}`);
    console.log(
      "  Usage: import { paths, components, operations } from '@/lib/types/openapi-generated'"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate types: ${message}`);
    process.exit(1);
  }
}

generateTypes().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
