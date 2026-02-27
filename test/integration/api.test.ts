import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, TEST_API_KEY } from '../helpers.js';

describe('Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Health ──────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.status).toBe('ok');
      expect(typeof body.data.uptimeSeconds).toBe('number');
      expect(body.data.buildVersion).toBeDefined();
    });
  });

  // ── OpenAPI ─────────────────────────────────────────

  describe('GET /openapi.json', () => {
    it('should return the OpenAPI spec', async () => {
      const res = await app.inject({ method: 'GET', url: '/openapi.json' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.openapi).toMatch(/^3\./);
      expect(body.info.title).toBe('AI Backend Platform');
    });
  });

  // ── Chat Summarize ──────────────────────────────────

  describe('POST /v1/chat/summarize', () => {
    const url = '/v1/chat/summarize';
    const headers = { 'x-api-key': TEST_API_KEY };

    it('should return a summary for valid messages', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: {
          messages: [
            { role: 'user', content: "Let's discuss the project timeline." },
            { role: 'assistant', content: 'Sure, we are targeting Q1 for delivery.' },
          ],
          style: 'concise',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.summary).toBeDefined();
      expect(body.data.keyPoints).toBeInstanceOf(Array);
      expect(body.data.actionItems).toBeInstanceOf(Array);
    });

    it('should reject empty messages', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: { messages: [] },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── Chat Insights ───────────────────────────────────

  describe('POST /v1/chat/insights', () => {
    const url = '/v1/chat/insights';
    const headers = { 'x-api-key': TEST_API_KEY };

    it('should return insights for valid messages', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: {
          messages: [{ role: 'user', content: 'Our team is doing great work.' }],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.sentiment).toBeDefined();
      expect(body.data.topics).toBeInstanceOf(Array);
    });
  });

  // ── Resume Score ────────────────────────────────────

  describe('POST /v1/resume/score', () => {
    const url = '/v1/resume/score';
    const headers = { 'x-api-key': TEST_API_KEY };

    it('should return a score for a valid resume', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: {
          resumeText:
            'Senior Software Engineer with 8 years of experience in TypeScript, Node.js, and cloud architecture. Led teams of 5+ engineers.',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(body.data.overallScore).toBeLessThanOrEqual(100);
      expect(body.data.matchedSkills).toBeInstanceOf(Array);
    });

    it('should reject a too-short resume', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: { resumeText: 'short' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── Resume Improve ──────────────────────────────────

  describe('POST /v1/resume/improve', () => {
    const url = '/v1/resume/improve';
    const headers = { 'x-api-key': TEST_API_KEY };

    it('should return improvements for a valid resume', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: {
          resumeText:
            'Developer with 3 years experience in JavaScript and React. Built several web applications.',
          targetRole: 'Full Stack Engineer',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.improvedBullets).toBeInstanceOf(Array);
      expect(body.data.keywordsToAdd).toBeInstanceOf(Array);
      expect(body.data.optimizedVersion).toBeDefined();
    });
  });

  // ── Content Generate ────────────────────────────────

  describe('POST /v1/content/generate', () => {
    const url = '/v1/content/generate';
    const headers = { 'x-api-key': TEST_API_KEY };

    it('should generate content for a valid prompt', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: {
          prompt: 'Write a short introduction about AI in healthcare',
          tone: 'professional',
          length: 'short',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.generatedText).toBeDefined();
      expect(body.data.tokensUsage.total).toBeGreaterThan(0);
    });

    it('should reject empty prompt', async () => {
      const res = await app.inject({
        method: 'POST',
        url,
        headers,
        payload: { prompt: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
