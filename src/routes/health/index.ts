import type { FastifyInstance } from 'fastify';
import { getConfig } from '../../config/index.js';

const startTime = Date.now();

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns server health status, uptime, and build version.',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  uptimeSeconds: { type: 'number', example: 123.45 },
                  buildVersion: { type: 'string', example: '1.0.0' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      const config = getConfig();
      return {
        data: {
          status: 'ok',
          uptimeSeconds: Math.round((Date.now() - startTime) / 1000),
          buildVersion: config.BUILD_VERSION,
        },
      };
    },
  );
}
