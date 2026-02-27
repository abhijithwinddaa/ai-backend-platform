import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { getConfig } from '../config/index.js';
import type { FastifyInstance } from 'fastify';

export default fp(
  async function corsPlugin(app: FastifyInstance) {
    const config = getConfig();
    const origins = config.CORS_ORIGINS;

    await app.register(cors, {
      origin: origins === '*' ? true : origins.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-Request-ID'],
      exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      credentials: true,
    });
  },
  { name: 'cors-plugin' },
);
