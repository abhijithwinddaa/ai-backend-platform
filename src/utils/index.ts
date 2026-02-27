import crypto from 'node:crypto';

/** Generate a unique request ID. */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/** Mask a secret for safe logging: shows first 4 chars + "***". */
export function maskSecret(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 4) + '****';
}

/** Safely parse JSON without throwing. */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
