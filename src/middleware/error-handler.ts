import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

/**
 * Global error handler. Maps known errors to structured { data, error } responses.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error({ err: error, reqId: request.id }, 'Request error');

  // Zod validation errors
  if (error instanceof ZodError) {
    reply.status(400).send({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }

  // Fastify validation errors (JSON schema)
  if (error.validation) {
    reply.status(400).send({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.validation,
      },
    });
    return;
  }

  // Body size limit
  if (error.statusCode === 413) {
    reply.status(413).send({
      data: null,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds maximum allowed size.',
      },
    });
    return;
  }

  // Rate limit
  if (error.statusCode === 429) {
    reply.status(429).send({
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message || 'Too many requests.',
      },
    });
    return;
  }

  // Default server error
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    data: null,
    error: {
      code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message: statusCode >= 500 ? 'An internal server error occurred.' : error.message,
    },
  });
}
