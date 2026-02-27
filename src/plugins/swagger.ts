import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { getConfig } from '../config/index.js';

export default fp(
  async function swaggerPlugin(app: FastifyInstance) {
    const config = getConfig();

    await app.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'AI Backend Platform',
          description:
            'Modular AI backend API — chat insights, resume ATS scoring, content generation, and more.',
          version: config.BUILD_VERSION,
          contact: { name: 'API Support' },
          license: { name: 'MIT', identifier: 'MIT' },
        },
        servers: [
          {
            url: 'http://localhost:{port}',
            description: 'Local development',
            variables: { port: { default: String(config.PORT) } },
          },
          {
            url: 'https://your-app.onrender.com',
            description: 'Render production (replace with actual URL)',
          },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'X-API-KEY',
              in: 'header',
              description: 'API key passed via X-API-KEY header',
            },
          },
        },
        tags: [
          { name: 'Health', description: 'Server health check' },
          { name: 'Chat', description: 'Chat summarization & insights' },
          { name: 'Resume', description: 'Resume ATS scoring & improvement' },
          { name: 'Content', description: 'Generic content generation' },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  },
  { name: 'swagger-plugin' },
);
