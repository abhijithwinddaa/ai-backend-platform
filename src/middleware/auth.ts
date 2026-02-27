import type { FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '../config/index.js';

/**
 * Pre-handler hook that validates the X-API-KEY header against the configured API_KEY.
 * Attach to any route or prefix that requires authentication.
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const config = getConfig();
  const apiKey = request.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    reply.status(401).send({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing X-API-KEY header.',
      },
    });
    return;
  }

  if (apiKey !== config.API_KEY) {
    reply.status(401).send({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key.',
      },
    });
    return;
  }
}
