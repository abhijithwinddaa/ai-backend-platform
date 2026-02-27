/**
 * Shared test helpers — builds a Fastify app with mock config for testing.
 */
import 'dotenv/config';
import { loadConfig, resetConfig } from '../src/config/index.js';
import { buildServer } from '../src/server.js';
import { resetAIProvider } from '../src/services/ai/index.js';
import type { FastifyInstance } from 'fastify';

export const TEST_API_KEY = 'test-api-key-12345';

/**
 * Build a fresh test server. Call app.close() in afterAll.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  // Set test env vars
  process.env.API_KEY = TEST_API_KEY;
  process.env.AI_PROVIDER = 'mock';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'warn';
  process.env.RATE_LIMIT_PER_MINUTE = '1000';

  // Reset singletons
  resetAIProvider();
  resetConfig();

  loadConfig();

  const app = await buildServer();
  await app.ready();
  return app;
}
