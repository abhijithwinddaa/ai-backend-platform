import type { FastifyInstance, FastifyRequest } from 'fastify';
import { SummarizeRequestSchema, InsightsRequestSchema } from '../../types/index.js';
import type { SummarizeRequest, InsightsRequest } from '../../types/index.js';
import { getAIProvider } from '../../services/ai/index.js';
import { authGuard } from '../../middleware/auth.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  // Apply auth guard to all routes in this prefix
  app.addHook('preHandler', authGuard);

  // ── POST /v1/chat/summarize ───────────────────────
  app.post(
    '/summarize',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Summarize a chat conversation',
        description: 'Analyzes chat messages and returns a summary, key points, and action items.',
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['role', 'content'],
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                  content: { type: 'string', minLength: 1 },
                },
              },
            },
            style: { type: 'string', enum: ['concise', 'detailed'], default: 'concise' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  keyPoints: { type: 'array', items: { type: 'string' } },
                  actionItems: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SummarizeRequest }>, _reply) => {
      const body = SummarizeRequestSchema.parse(request.body);
      const provider = getAIProvider();
      const result = await provider.summarizeChat(body.messages, body.style);
      return { data: result };
    },
  );

  // ── POST /v1/chat/insights ────────────────────────
  app.post(
    '/insights',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Extract insights from a chat conversation',
        description:
          'Analyzes chat messages and returns sentiment, topics, entities, risks, and follow-ups.',
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['role', 'content'],
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                  content: { type: 'string', minLength: 1 },
                },
              },
            },
            signals: {
              type: 'object',
              properties: {
                sentiment: { type: 'boolean', default: true },
                topics: { type: 'boolean', default: true },
                entities: { type: 'boolean', default: true },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  sentiment: {
                    type: ['object', 'null'],
                    properties: {
                      label: { type: 'string' },
                      score: { type: 'number' },
                    },
                  },
                  topics: { type: 'array', items: { type: 'string' } },
                  entities: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } },
                  followUps: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: InsightsRequest }>, _reply) => {
      const body = InsightsRequestSchema.parse(request.body);
      const provider = getAIProvider();
      const result = await provider.extractInsights(body.messages, body.signals);
      return { data: result };
    },
  );
}
