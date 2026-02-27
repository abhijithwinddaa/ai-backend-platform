import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, TEST_API_KEY } from '../helpers.js';

describe('Auth Guard', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject requests without X-API-KEY header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat/summarize',
      payload: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Missing');
  });

  it('should reject requests with invalid API key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat/summarize',
      headers: { 'x-api-key': 'wrong-key' },
      payload: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('Invalid');
  });

  it('should allow requests with valid API key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat/summarize',
      headers: { 'x-api-key': TEST_API_KEY },
      payload: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeDefined();
  });

  it('should NOT require auth for /health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('ok');
  });
});
