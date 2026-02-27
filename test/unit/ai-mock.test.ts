import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../../src/services/ai/mock-provider.js';

describe('MockAIProvider', () => {
  const provider = new MockAIProvider();

  it('should have name "mock"', () => {
    expect(provider.name).toBe('mock');
  });

  describe('summarizeChat', () => {
    it('should return concise summary by default', async () => {
      const result = await provider.summarizeChat([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);

      expect(result.summary).toContain('2 messages');
      expect(result.keyPoints).toBeInstanceOf(Array);
      expect(result.keyPoints.length).toBeGreaterThan(0);
      expect(result.actionItems).toBeInstanceOf(Array);
      expect(result.actionItems.length).toBeGreaterThan(0);
    });

    it('should return detailed summary when specified', async () => {
      const result = await provider.summarizeChat([{ role: 'user', content: 'Hello' }], 'detailed');

      expect(result.summary).toContain('Detailed');
    });
  });

  describe('extractInsights', () => {
    it('should return all signals by default', async () => {
      const result = await provider.extractInsights([{ role: 'user', content: 'Test message' }]);

      expect(result.sentiment).not.toBeNull();
      expect(result.sentiment?.score).toBeGreaterThan(0);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.followUps.length).toBeGreaterThan(0);
    });

    it('should omit sentiment when disabled', async () => {
      const result = await provider.extractInsights([{ role: 'user', content: 'Hello' }], {
        sentiment: false,
      });

      expect(result.sentiment).toBeNull();
    });
  });

  describe('scoreResume', () => {
    it('should return a score between 0 and 100', async () => {
      const result = await provider.scoreResume(
        'Experienced TypeScript developer with 5 years of experience building REST APIs.',
      );

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.rationale).toBeDefined();
      expect(result.matchedSkills.length).toBeGreaterThan(0);
    });

    it('should adjust response when job description is provided', async () => {
      const result = await provider.scoreResume(
        'Developer with experience in Node.js',
        'Senior Node.js developer needed',
      );

      expect(result.rationale).toContain('job description');
    });
  });

  describe('improveResume', () => {
    it('should return improvement suggestions', async () => {
      const result = await provider.improveResume(
        'Developer with 3 years experience',
        undefined,
        'Senior Engineer',
      );

      expect(result.improvedBullets.length).toBeGreaterThan(0);
      expect(result.keywordsToAdd.length).toBeGreaterThan(0);
      expect(result.formattingSuggestions.length).toBeGreaterThan(0);
      expect(result.optimizedVersion).toContain('Senior Engineer');
    });
  });

  describe('generateContent', () => {
    it('should return generated text with token usage', async () => {
      const result = await provider.generateContent('Write a greeting', {
        tone: 'friendly',
        length: 'short',
      });

      expect(result.generatedText).toBeDefined();
      expect(result.generatedText.length).toBeGreaterThan(0);
      expect(result.tokensUsage.total).toBeGreaterThan(0);
      expect(result.tokensUsage.total).toBe(
        result.tokensUsage.prompt + result.tokensUsage.completion,
      );
    });
  });
});
