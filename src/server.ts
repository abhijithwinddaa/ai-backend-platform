import Fastify, { type FastifyInstance } from 'fastify';
import { getConfig } from './config/index.js';
import { corsPlugin, securityPlugin, rateLimitPlugin, swaggerPlugin } from './plugins/index.js';
import { requestIdPlugin, errorHandler } from './middleware/index.js';
import { healthRoutes } from './routes/health/index.js';
import { chatRoutes } from './routes/chat/index.js';
import { resumeRoutes } from './routes/resume/index.js';
import { contentRoutes } from './routes/content/index.js';
import { generateRequestId } from './utils/index.js';

export async function buildServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
        : {}),
    },
    genReqId: (req) => {
      return (req.headers['x-request-id'] as string) || generateRequestId();
    },
    bodyLimit: config.MAX_BODY_SIZE_BYTES,
  });

  // ── Global error handler ──────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Plugins ───────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(securityPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(requestIdPlugin);

  // ── Routes ────────────────────────────────────────
  // Public routes
  await app.register(healthRoutes);

  // OpenAPI JSON endpoint (public)
  app.get(
    '/openapi.json',
    {
      schema: {
        tags: ['Health'],
        summary: 'OpenAPI specification',
        description: 'Returns the OpenAPI 3.1 JSON specification for this API.',
        hide: true,
      },
    },
    async (_req, _reply) => {
      return app.swagger();
    },
  );

  // Protected v1 routes
  await app.register(chatRoutes, { prefix: '/v1/chat' });
  await app.register(resumeRoutes, { prefix: '/v1/resume' });
  await app.register(contentRoutes, { prefix: '/v1/content' });

  return app;
}
