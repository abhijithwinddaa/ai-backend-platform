/**
 * Emit the OpenAPI JSON spec to a file.
 * Usage: npx tsx scripts/emit-openapi.ts
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../src/config/index.js';
import { buildServer } from '../src/server.js';

async function emit(): Promise<void> {
  // Need config loaded for server to build
  process.env.API_KEY = process.env.API_KEY || 'emit-placeholder';
  loadConfig();

  const app = await buildServer();
  await app.ready();

  const spec = app.swagger();
  mkdirSync('openapi', { recursive: true });
  writeFileSync('openapi/openapi.json', JSON.stringify(spec, null, 2), 'utf-8');

  // eslint-disable-next-line no-console
  console.log('✅ OpenAPI spec written to openapi/openapi.json');
  await app.close();
}

emit().catch((err) => {
  console.error('Failed to emit OpenAPI spec:', err);
  process.exit(1);
});
