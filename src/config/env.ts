import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BUILD_VERSION: z.string().default('0.0.0'),

  API_KEY: z.string().min(1, 'API_KEY is required'),

  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
  MAX_BODY_SIZE_BYTES: z.coerce.number().default(1_048_576),

  AI_PROVIDER: z.enum(['mock', 'openai', 'azure']).default('mock'),

  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().optional().default('gpt-4o'),

  AZURE_OPENAI_ENDPOINT: z.string().optional().default(''),
  AZURE_OPENAI_KEY: z.string().optional().default(''),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional().default(''),
  AZURE_OPENAI_API_VERSION: z.string().optional().default('2024-08-01-preview'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Exported for test reset only — do not use directly in app code.
export let _config: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (_config) return _config;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(errors)
      .map(([key, errs]) => `  ${key}: ${(errs ?? []).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${msg}`);
  }

  _config = parsed.data;
  return _config;
}

export function getConfig(): EnvConfig {
  if (!_config) throw new Error('Config not loaded. Call loadConfig() first.');
  return _config;
}

/** Reset the cached config (used by tests). */
export function resetConfig(): void {
  _config = null;
}
