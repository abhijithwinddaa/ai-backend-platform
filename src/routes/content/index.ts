import type { FastifyInstance, FastifyRequest } from 'fastify';
import { GenerateContentRequestSchema } from '../../types/index.js';
import type { GenerateContentRequest } from '../../types/index.js';
import { getAIProvider } from '../../services/ai/index.js';
import { authGuard } from '../../middleware/auth.js';

export async function contentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── POST /v1/content/generate ─────────────────────
  app.post(
    '/generate',
    {
      schema: {
        tags: ['Content'],
        summary: 'Generate content from a prompt',
        description: 'Generates text content based on a prompt with configurable tone and length.',
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: { type: 'string', minLength: 1 },
            tone: { type: 'string' },
            length: { type: 'string', enum: ['short', 'medium', 'long'], default: 'medium' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  generatedText: { type: 'string' },
                  tokensUsage: {
                    type: 'object',
                    properties: {
                      prompt: { type: 'number' },
                      completion: { type: 'number' },
                      total: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateContentRequest }>, _reply) => {
      const body = GenerateContentRequestSchema.parse(request.body);
      const provider = getAIProvider();
      const result = await provider.generateContent(body.prompt, {
        tone: body.tone,
        length: body.length,
      });
      return { data: result };
    },
  );
}
