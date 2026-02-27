import OpenAI from 'openai';
import { getConfig } from '../../config/index.js';
import type {
  AIProvider,
  Message,
  SummaryResult,
  InsightsOptions,
  InsightsResult,
  ScoreResult,
  ImproveResult,
  GenOptions,
  GenResult,
} from '../../types/index.js';

/**
 * Real AI provider using the OpenAI SDK.
 * Supports both openai.com and Azure OpenAI endpoints.
 */
export class OpenAIProvider implements AIProvider {
  readonly name: string;
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getConfig();

    if (config.AI_PROVIDER === 'azure') {
      this.name = 'azure-openai';
      this.client = new OpenAI({
        apiKey: config.AZURE_OPENAI_KEY,
        baseURL: `${config.AZURE_OPENAI_ENDPOINT}/openai/deployments/${config.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': config.AZURE_OPENAI_API_VERSION },
        defaultHeaders: { 'api-key': config.AZURE_OPENAI_KEY },
      });
      this.model = config.AZURE_OPENAI_DEPLOYMENT;
    } else {
      this.name = 'openai';
      this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
      this.model = config.OPENAI_MODEL || 'gpt-4o';
    }
  }

  private async chat(
    systemPrompt: string,
    userContent: string,
    temperature = 0.7,
  ): Promise<{ text: string; usage: { prompt: number; completion: number; total: number } }> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const usage = {
      prompt: response.usage?.prompt_tokens ?? 0,
      completion: response.usage?.completion_tokens ?? 0,
      total: response.usage?.total_tokens ?? 0,
    };

    return { text, usage };
  }

  private parseJson<T>(raw: string): T {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }

  async summarizeChat(messages: Message[], style?: 'concise' | 'detailed'): Promise<SummaryResult> {
    const systemPrompt = `You are an expert conversation analyst. Summarize the following conversation.
Return ONLY valid JSON with this exact structure:
{
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": ["string"]
}
Style: ${style ?? 'concise'}. ${style === 'detailed' ? 'Provide thorough analysis.' : 'Be brief and focused.'}`;

    const messagesText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const { text } = await this.chat(systemPrompt, messagesText, 0.3);
    return this.parseJson<SummaryResult>(text);
  }

  async extractInsights(messages: Message[], options?: InsightsOptions): Promise<InsightsResult> {
    const signals = [];
    if (options?.sentiment !== false)
      signals.push('"sentiment": { "label": "positive|negative|neutral", "score": 0.0-1.0 }');
    else signals.push('"sentiment": null');
    if (options?.topics !== false) signals.push('"topics": ["string"]');
    else signals.push('"topics": []');
    if (options?.entities !== false) signals.push('"entities": ["string"]');
    else signals.push('"entities": []');

    const systemPrompt = `You are an expert conversation analyst. Extract insights from the conversation.
Return ONLY valid JSON:
{
  ${signals.join(',\n  ')},
  "risks": ["string"],
  "followUps": ["string"]
}`;

    const messagesText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const { text } = await this.chat(systemPrompt, messagesText, 0.3);
    return this.parseJson<InsightsResult>(text);
  }

  async scoreResume(resumeText: string, jobDescription?: string): Promise<ScoreResult> {
    const jdClause = jobDescription
      ? `\n\nJob Description:\n${jobDescription}`
      : '\n\nNo specific job description provided. Evaluate against general best practices.';

    const systemPrompt = `You are an expert ATS resume evaluator. Score the resume 0-100.
Return ONLY valid JSON:
{
  "overallScore": number,
  "rationale": "string",
  "matchedSkills": ["string"],
  "missingSkills": ["string"]
}`;

    const { text } = await this.chat(systemPrompt, `Resume:\n${resumeText}${jdClause}`, 0.2);
    return this.parseJson<ScoreResult>(text);
  }

  async improveResume(
    resumeText: string,
    jobDescription?: string,
    targetRole?: string,
  ): Promise<ImproveResult> {
    const extraContext = [
      jobDescription ? `Job Description: ${jobDescription}` : '',
      targetRole ? `Target Role: ${targetRole}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `You are an expert resume writer and ATS optimizer.
Return ONLY valid JSON:
{
  "improvedBullets": ["string"],
  "keywordsToAdd": ["string"],
  "formattingSuggestions": ["string"],
  "optimizedVersion": "string (the full optimized resume text)"
}`;

    const { text } = await this.chat(systemPrompt, `Resume:\n${resumeText}\n${extraContext}`, 0.4);
    return this.parseJson<ImproveResult>(text);
  }

  async generateContent(prompt: string, opts?: GenOptions): Promise<GenResult> {
    const lengthGuide = { short: '~100 words', medium: '~300 words', long: '~600 words' };
    const tone = opts?.tone ?? 'professional';
    const length = lengthGuide[opts?.length ?? 'medium'];

    const systemPrompt = `Generate content in a ${tone} tone. Target length: ${length}. Write only the requested content, no meta commentary.`;

    const { text, usage } = await this.chat(systemPrompt, prompt, 0.7);

    return {
      generatedText: text,
      tokensUsage: usage,
    };
  }
}
