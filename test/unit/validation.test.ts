import { describe, it, expect } from 'vitest';
import {
  SummarizeRequestSchema,
  InsightsRequestSchema,
  ScoreResumeRequestSchema,
  ImproveResumeRequestSchema,
  GenerateContentRequestSchema,
} from '../../src/types/index.js';

describe('Validation Schemas', () => {
  describe('SummarizeRequestSchema', () => {
    it('should accept valid input', () => {
      const result = SummarizeRequestSchema.parse({
        messages: [{ role: 'user', content: 'Hello world' }],
        style: 'concise',
      });
      expect(result.messages).toHaveLength(1);
      expect(result.style).toBe('concise');
    });

    it('should default style to concise', () => {
      const result = SummarizeRequestSchema.parse({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.style).toBe('concise');
    });

    it('should reject empty messages array', () => {
      expect(() => SummarizeRequestSchema.parse({ messages: [] })).toThrow();
    });

    it('should reject invalid role', () => {
      expect(() =>
        SummarizeRequestSchema.parse({
          messages: [{ role: 'invalid', content: 'Hello' }],
        }),
      ).toThrow();
    });

    it('should reject empty content', () => {
      expect(() =>
        SummarizeRequestSchema.parse({
          messages: [{ role: 'user', content: '' }],
        }),
      ).toThrow();
    });
  });

  describe('InsightsRequestSchema', () => {
    it('should accept valid input with signals', () => {
      const result = InsightsRequestSchema.parse({
        messages: [{ role: 'user', content: 'Test' }],
        signals: { sentiment: true, topics: false },
      });
      expect(result.signals.sentiment).toBe(true);
      expect(result.signals.topics).toBe(false);
    });

    it('should default signals to all true', () => {
      const result = InsightsRequestSchema.parse({
        messages: [{ role: 'user', content: 'Test' }],
      });
      expect(result.signals.sentiment).toBe(true);
      expect(result.signals.topics).toBe(true);
      expect(result.signals.entities).toBe(true);
    });
  });

  describe('ScoreResumeRequestSchema', () => {
    it('should accept valid resume', () => {
      const result = ScoreResumeRequestSchema.parse({
        resumeText: 'Experienced developer with 5 years of expertise',
      });
      expect(result.resumeText).toBeDefined();
      expect(result.jobDescription).toBeUndefined();
    });

    it('should accept resume with job description', () => {
      const result = ScoreResumeRequestSchema.parse({
        resumeText: 'Experienced developer with 5 years of expertise',
        jobDescription: 'Looking for a senior developer',
      });
      expect(result.jobDescription).toBeDefined();
    });

    it('should reject too-short resume', () => {
      expect(() => ScoreResumeRequestSchema.parse({ resumeText: 'short' })).toThrow();
    });
  });

  describe('ImproveResumeRequestSchema', () => {
    it('should accept valid input with optional fields', () => {
      const result = ImproveResumeRequestSchema.parse({
        resumeText: 'Experienced developer with 5 years of expertise',
        targetRole: 'Senior Engineer',
      });
      expect(result.targetRole).toBe('Senior Engineer');
    });
  });

  describe('GenerateContentRequestSchema', () => {
    it('should accept valid prompt', () => {
      const result = GenerateContentRequestSchema.parse({
        prompt: 'Write a blog post about AI',
        tone: 'casual',
        length: 'short',
      });
      expect(result.tone).toBe('casual');
      expect(result.length).toBe('short');
    });

    it('should default length to medium', () => {
      const result = GenerateContentRequestSchema.parse({
        prompt: 'Write something',
      });
      expect(result.length).toBe('medium');
    });

    it('should reject empty prompt', () => {
      expect(() => GenerateContentRequestSchema.parse({ prompt: '' })).toThrow();
    });
  });
});
