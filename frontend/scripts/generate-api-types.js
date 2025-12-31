const { generate } = require('openapi-typescript-codegen');
const path = require('path');
const fs = require('fs');

async function generateTypes() {
  const openApiPath = path.join(__dirname, '../openapi.json');
  const outputPath = path.join(__dirname, '../lib/types/api-generated');

  console.log('📝 Generating API types from OpenAPI spec...');
  console.log(`   Input: ${openApiPath}`);
  console.log(`   Output: ${outputPath}`);

  // Check if openapi.json exists
  if (!fs.existsSync(openApiPath)) {
    console.error('❌ OpenAPI spec not found!');
    console.error('💡 Please run the backend and export the spec first:');
    console.error('   cd backend && cargo run --bin api');
    console.error('   curl http://localhost:3000/api-docs/openapi.json -o frontend/openapi.json');
    process.exit(1);
  }

  try {
    await generate({
      input: openApiPath,
      output: outputPath,
      httpClient: 'axios',
      useOptions: true,
      exportCore: true,
      exportServices: true,
      exportSchemas: true,
      indent: '  ',
    });

    console.log('✅ API types generated successfully!');

    // Generate stats
    const files = fs.readdirSync(outputPath);
    const tsFiles = files.filter(f => f.endsWith('.ts')).length;

    console.log(`📊 Generated ${tsFiles} TypeScript files`);
    console.log('');
    console.log('💡 You can now import generated types:');
    console.log('   import { Api } from "@/lib/types/api-generated"');
  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    process.exit(1);
  }
}

generateTypes().catch(console.error);
