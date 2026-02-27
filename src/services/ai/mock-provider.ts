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
 * Mock AI provider — returns deterministic responses with no external calls.
 * Perfect for local development and testing.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async summarizeChat(messages: Message[], style?: 'concise' | 'detailed'): Promise<SummaryResult> {
    const messageCount = messages.length;
    const isDetailed = style === 'detailed';

    return {
      summary: isDetailed
        ? `Detailed summary of ${messageCount} messages: The conversation covered multiple topics including project planning, technical decisions, and follow-up actions. Participants discussed key architectural choices and agreed on next steps.`
        : `Concise summary of ${messageCount} messages: Key topics discussed with action items identified.`,
      keyPoints: [
        'Project architecture was discussed',
        'Team alignment on tech stack confirmed',
        'Timeline for delivery set to Q1',
      ],
      actionItems: [
        'Schedule follow-up meeting for next week',
        'Review the technical proposal document',
        'Share updated timeline with stakeholders',
      ],
    };
  }

  async extractInsights(messages: Message[], options?: InsightsOptions): Promise<InsightsResult> {
    const result: InsightsResult = {
      sentiment: null,
      topics: [],
      entities: [],
      risks: [],
      followUps: [],
    };

    if (options?.sentiment !== false) {
      result.sentiment = { label: 'positive', score: 0.82 };
    }

    if (options?.topics !== false) {
      result.topics = ['project planning', 'technology', 'team collaboration'];
    }

    if (options?.entities !== false) {
      result.entities = ['TypeScript', 'Fastify', 'Azure OpenAI'];
    }

    result.risks = ['Tight deadline may require scope adjustment'];
    result.followUps = [
      `Review the ${messages.length} messages for pending decisions`,
      'Confirm resource allocation by end of week',
    ];

    return result;
  }

  async scoreResume(resumeText: string, jobDescription?: string): Promise<ScoreResult> {
    const hasJD = Boolean(jobDescription);
    const wordCount = resumeText.split(/\s+/).length;
    const score = Math.min(100, Math.max(0, 45 + Math.floor(wordCount / 10)));

    return {
      overallScore: score,
      rationale: hasJD
        ? `Evaluated against the provided job description. Resume has ${wordCount} words and covers several matching areas.`
        : `General ATS evaluation. Resume has ${wordCount} words. Consider providing a job description for more targeted feedback.`,
      matchedSkills: ['TypeScript', 'Node.js', 'REST APIs', 'Git'],
      missingSkills: hasJD
        ? ['Kubernetes', 'CI/CD pipelines', 'GraphQL']
        : ['Consider specifying a job description for skill gap analysis'],
    };
  }

  async improveResume(
    resumeText: string,
    jobDescription?: string,
    targetRole?: string,
  ): Promise<ImproveResult> {
    const role = targetRole || 'Software Engineer';

    return {
      improvedBullets: [
        `Led cross-functional team of 5 engineers to deliver a high-availability microservices platform, improving system uptime by 99.9%`,
        `Architected and implemented RESTful APIs serving 10K+ daily active users with sub-100ms latency`,
        `Reduced CI/CD pipeline execution time by 40% through parallelization and caching strategies`,
      ],
      keywordsToAdd: [
        'scalable architecture',
        'agile methodology',
        'cloud-native',
        role.toLowerCase(),
      ],
      formattingSuggestions: [
        'Use consistent bullet point style throughout',
        'Add quantifiable metrics to each achievement',
        'Ensure contact information is at the top',
        'Keep resume to 1-2 pages maximum',
      ],
      optimizedVersion: `# ${role} — Optimized Resume\n\n${resumeText}\n\n## Key Additions\n- Added quantifiable metrics\n- Aligned keywords with ${jobDescription ? 'job description' : 'industry standards'}\n- Improved formatting for ATS compatibility`,
    };
  }

  async generateContent(prompt: string, opts?: GenOptions): Promise<GenResult> {
    const lengthMap = { short: 50, medium: 150, long: 300 };
    const targetWords = lengthMap[opts?.length ?? 'medium'];
    const tone = opts?.tone ?? 'professional';

    const generatedText = `[Generated content in ${tone} tone, ~${targetWords} words]\n\nBased on the prompt: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"\n\nThis is a mock-generated response that demonstrates the content generation capability. In production with a real AI provider, this would contain meaningful, contextual content tailored to your specific requirements and tone preferences. The response would be approximately ${targetWords} words long and written in a ${tone} tone.`;

    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(generatedText.length / 4);

    return {
      generatedText,
      tokensUsage: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
    };
  }
}
