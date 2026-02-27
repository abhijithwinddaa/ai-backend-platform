import 'dotenv/config';
import { loadConfig } from './config/index.js';
import { buildServer } from './server.js';
import { getAIProvider } from './services/ai/index.js';
import { maskSecret } from './utils/index.js';

async function main(): Promise<void> {
  // Load and validate configuration
  const config = loadConfig();

  // Build Fastify server
  const app = await buildServer();

  // Eager-init the AI provider so errors surface on boot
  const aiProvider = getAIProvider();

  // Start listening
  const address = await app.listen({ port: config.PORT, host: '0.0.0.0' });

  app.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  app.log.info(`🚀  AI Backend Platform v${config.BUILD_VERSION}`);
  app.log.info(`📡  Base URL: ${address}`);
  app.log.info(`🌍  Environment: ${config.NODE_ENV}`);
  app.log.info(`🤖  AI Provider: ${aiProvider.name}`);
  app.log.info(`🔑  API Key: ${maskSecret(config.API_KEY)}`);
  app.log.info(`📖  Swagger UI: ${address}/docs`);
  app.log.info(`📄  OpenAPI JSON: ${address}/openapi.json`);
  app.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`);
      await app.close();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
