import { getConfig } from '../../config/index.js';
import type { AIProvider } from '../../types/index.js';
import { MockAIProvider } from './mock-provider.js';
import { OpenAIProvider } from './openai-provider.js';

let _provider: AIProvider | null = null;

/**
 * Factory: create the AI provider based on AI_PROVIDER env var.
 * Caches the singleton instance.
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const config = getConfig();

  switch (config.AI_PROVIDER) {
    case 'openai':
    case 'azure':
      _provider = new OpenAIProvider();
      break;
    case 'mock':
    default:
      _provider = new MockAIProvider();
      break;
  }

  return _provider;
}

/**
 * Reset the cached provider (useful for tests).
 */
export function resetAIProvider(): void {
  _provider = null;
}

export { MockAIProvider } from './mock-provider.js';
export { OpenAIProvider } from './openai-provider.js';
