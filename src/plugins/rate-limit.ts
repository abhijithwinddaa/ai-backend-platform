import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from '../config/index.js';
import type { FastifyInstance } from 'fastify';

export default fp(
  async function rateLimitPlugin(app: FastifyInstance) {
    const config = getConfig();

    await app.register(rateLimit, {
      max: config.RATE_LIMIT_PER_MINUTE,
      timeWindow: '1 minute',
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
      errorResponseBuilder: (_req, context) => ({
        data: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Max ${context.max} requests per ${context.after}. Please retry after ${context.after}.`,
        },
      }),
    });
  },
  { name: 'rate-limit-plugin' },
);
