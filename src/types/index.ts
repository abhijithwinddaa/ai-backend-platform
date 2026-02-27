import { z } from 'zod';

// ── Generic API Response ──────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ── Chat Schemas ──────────────────────────────────────

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50_000),
});

export type Message = z.infer<typeof MessageSchema>;

export const SummarizeRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(200),
  style: z.enum(['concise', 'detailed']).optional().default('concise'),
});

export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export const InsightsRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(200),
  signals: z
    .object({
      sentiment: z.boolean().optional().default(true),
      topics: z.boolean().optional().default(true),
      entities: z.boolean().optional().default(true),
    })
    .optional()
    .default({}),
});

export type InsightsRequest = z.infer<typeof InsightsRequestSchema>;

export interface InsightsResult {
  sentiment: { label: string; score: number } | null;
  topics: string[];
  entities: string[];
  risks: string[];
  followUps: string[];
}

// ── Resume / ATS Schemas ──────────────────────────────

export const ScoreResumeRequestSchema = z.object({
  resumeText: z.string().min(10).max(100_000),
  jobDescription: z.string().max(50_000).optional(),
});

export type ScoreResumeRequest = z.infer<typeof ScoreResumeRequestSchema>;

export interface ScoreResult {
  overallScore: number;
  rationale: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export const ImproveResumeRequestSchema = z.object({
  resumeText: z.string().min(10).max(100_000),
  jobDescription: z.string().max(50_000).optional(),
  targetRole: z.string().max(200).optional(),
});

export type ImproveResumeRequest = z.infer<typeof ImproveResumeRequestSchema>;

export interface ImproveResult {
  improvedBullets: string[];
  keywordsToAdd: string[];
  formattingSuggestions: string[];
  optimizedVersion: string;
}

// ── Content Schemas ───────────────────────────────────

export const GenerateContentRequestSchema = z.object({
  prompt: z.string().min(1).max(50_000),
  tone: z.string().max(100).optional(),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
});

export type GenerateContentRequest = z.infer<typeof GenerateContentRequestSchema>;

export interface GenOptions {
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface GenResult {
  generatedText: string;
  tokensUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ── AI Provider Interface ─────────────────────────────

export interface InsightsOptions {
  sentiment?: boolean;
  topics?: boolean;
  entities?: boolean;
}

export interface AIProvider {
  readonly name: string;
  summarizeChat(messages: Message[], style?: 'concise' | 'detailed'): Promise<SummaryResult>;
  extractInsights(messages: Message[], options?: InsightsOptions): Promise<InsightsResult>;
  scoreResume(resumeText: string, jobDescription?: string): Promise<ScoreResult>;
  improveResume(
    resumeText: string,
    jobDescription?: string,
    targetRole?: string,
  ): Promise<ImproveResult>;
  generateContent(prompt: string, opts?: GenOptions): Promise<GenResult>;
}
