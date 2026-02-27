import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export default fp(
  async function securityPlugin(app: FastifyInstance) {
    await app.register(helmet, {
      contentSecurityPolicy: false, // Swagger UI needs inline scripts
    });
  },
  { name: 'security-plugin' },
);
