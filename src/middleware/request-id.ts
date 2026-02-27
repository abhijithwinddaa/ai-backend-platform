import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { generateRequestId } from '../utils/index.js';

/**
 * Assigns a unique request ID to every request and exposes it as a response header.
 */
export default fp(
  async function requestIdPlugin(app: FastifyInstance) {
    app.addHook('onRequest', async (request, reply) => {
      // Use incoming X-Request-ID or generate a new one
      const incoming = request.headers['x-request-id'] as string | undefined;
      const id = incoming || generateRequestId();
      // Fastify exposes request.id — we set it via genReqId, but also set the header
      reply.header('X-Request-ID', id);
    });
  },
  { name: 'request-id-plugin' },
);
