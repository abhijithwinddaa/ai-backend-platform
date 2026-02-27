import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ScoreResumeRequestSchema, ImproveResumeRequestSchema } from '../../types/index.js';
import type { ScoreResumeRequest, ImproveResumeRequest } from '../../types/index.js';
import { getAIProvider } from '../../services/ai/index.js';
import { authGuard } from '../../middleware/auth.js';

export async function resumeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── POST /v1/resume/score ─────────────────────────
  app.post(
    '/score',
    {
      schema: {
        tags: ['Resume'],
        summary: 'Score a resume against a job description',
        description:
          'Evaluates a resume with ATS scoring (0-100), matched/missing skills, and rationale.',
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['resumeText'],
          properties: {
            resumeText: { type: 'string', minLength: 10 },
            jobDescription: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  overallScore: { type: 'number' },
                  rationale: { type: 'string' },
                  matchedSkills: { type: 'array', items: { type: 'string' } },
                  missingSkills: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ScoreResumeRequest }>, _reply) => {
      const body = ScoreResumeRequestSchema.parse(request.body);
      const provider = getAIProvider();
      const result = await provider.scoreResume(body.resumeText, body.jobDescription);
      return { data: result };
    },
  );

  // ── POST /v1/resume/improve ───────────────────────
  app.post(
    '/improve',
    {
      schema: {
        tags: ['Resume'],
        summary: 'Improve a resume for ATS optimization',
        description:
          'Returns improved bullets, keywords, formatting suggestions, and an optimized resume version.',
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['resumeText'],
          properties: {
            resumeText: { type: 'string', minLength: 10 },
            jobDescription: { type: 'string' },
            targetRole: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  improvedBullets: { type: 'array', items: { type: 'string' } },
                  keywordsToAdd: { type: 'array', items: { type: 'string' } },
                  formattingSuggestions: { type: 'array', items: { type: 'string' } },
                  optimizedVersion: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ImproveResumeRequest }>, _reply) => {
      const body = ImproveResumeRequestSchema.parse(request.body);
      const provider = getAIProvider();
      const result = await provider.improveResume(
        body.resumeText,
        body.jobDescription,
        body.targetRole,
      );
      return { data: result };
    },
  );
}
