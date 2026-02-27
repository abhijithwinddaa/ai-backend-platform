# AI Backend Platform

> **Modular, production-ready AI backend** built with **Fastify + TypeScript** — chat insights, resume ATS scoring, content generation, and more. Designed as a reusable foundation for multiple AI-powered projects.

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Backend Platform                        │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│   /health   │  /v1/chat/*  │ /v1/resume/* │  /v1/content/*     │
│  (public)   │  (auth)      │  (auth)      │  (auth)            │
├─────────────┴──────────────┴──────────────┴────────────────────┤
│  Middleware: Auth (X-API-KEY) │ Rate Limit │ CORS │ Helmet     │
├────────────────────────────────────────────────────────────────┤
│  AI Provider Abstraction Layer (mock / openai / azure)         │
├────────────────────────────────────────────────────────────────┤
│  Fastify + Pino Logging │ Zod Validation │ OpenAPI/Swagger     │
└────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start (Local)](#quick-start-local)
3. [AI Provider Configuration](#ai-provider-configuration)
4. [Security & Auth](#security--auth)
5. [API Endpoints](#api-endpoints)
6. [Render Deployment](#render-deployment)
7. [OpenAPI / Swagger](#openapi--swagger)
8. [Microsoft 365 Copilot Plugin Integration](#microsoft-365-copilot-plugin-integration)
9. [How to Add a New Endpoint](#how-to-add-a-new-endpoint)
10. [Testing](#testing)
11. [Sample Requests](#sample-requests)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Project Overview

This platform provides a **shared AI backend** for:

| Project         | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Chat App**    | Summarize conversations, extract sentiment/topics/entities            |
| **Resume ATS**  | Score resumes 0–100, identify skill gaps, generate optimized versions |
| **Content Gen** | Generate text content with configurable tone and length               |
| **Future**      | Add any new AI endpoint quickly using the provider pattern            |

### Tech Stack

- **Runtime:** Node.js 20+ (TypeScript, strict mode)
- **Framework:** Fastify 5
- **Validation:** Zod + Fastify JSON Schema
- **Auth:** API key via `X-API-KEY` header
- **Security:** CORS, rate limiting, Helmet, body size limits
- **Logging:** Pino (structured JSON, request IDs)
- **Docs:** OpenAPI 3.1, Swagger UI
- **Testing:** Vitest + Fastify inject
- **Lint/Format:** ESLint + Prettier

### Repository Structure

```
ai-backend-platform/
├── src/
│   ├── config/          # Typed env config with Zod
│   ├── plugins/         # Fastify plugins (CORS, Helmet, rate-limit, Swagger)
│   ├── middleware/       # Auth guard, error handler, request-ID
│   ├── routes/
│   │   ├── health/      # GET /health
│   │   ├── chat/        # POST /v1/chat/summarize, /v1/chat/insights
│   │   ├── resume/      # POST /v1/resume/score, /v1/resume/improve
│   │   └── content/     # POST /v1/content/generate
│   ├── services/
│   │   └── ai/          # Provider-agnostic AI layer (mock + OpenAI)
│   ├── types/           # Shared TypeScript types & Zod schemas
│   ├── utils/           # Helpers (request ID, secret masking)
│   ├── server.ts        # Fastify app builder
│   └── index.ts         # Entry point (bootstrap)
├── test/
│   ├── unit/            # Auth, validation, AI mock tests
│   └── integration/     # Full API endpoint tests
├── scripts/
│   └── emit-openapi.ts  # Emit OpenAPI JSON to file
├── openapi/             # Generated OpenAPI spec (after running emit)
├── plugin-manifest.json # Microsoft 365 Copilot plugin scaffold
├── render.yaml          # Render IaC deployment
├── Dockerfile           # Multi-stage Docker build
├── .env.example         # All environment variables
└── package.json
```

---

## Quick Start (Local)

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 10+**

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ai-backend-platform

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env — the defaults use mock AI provider, no keys needed

# 4. Start the dev server (with hot-reload)
npm run dev

# 5. Verify it works
curl http://localhost:3000/health
# → {"data":{"status":"ok","uptimeSeconds":5,"buildVersion":"1.0.0"}}

# 6. Call a protected endpoint
curl -X POST http://localhost:3000/v1/chat/summarize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{"messages":[{"role":"user","content":"Let'\''s plan the sprint."},{"role":"assistant","content":"Sure, what are the priorities?"}]}'
```

### npm Scripts

| Script                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start dev server with hot-reload (tsx watch) |
| `npm run build`        | Compile TypeScript to `dist/`                |
| `npm start`            | Run production build                         |
| `npm test`             | Run all tests                                |
| `npm run test:watch`   | Run tests in watch mode                      |
| `npm run lint`         | Lint source code                             |
| `npm run format`       | Format source code                           |
| `npm run openapi:emit` | Generate `openapi/openapi.json`              |

---

## AI Provider Configuration

The platform uses a **provider-agnostic abstraction** so you can swap AI backends without changing route logic.

### Mock Provider (default)

```env
AI_PROVIDER=mock
```

No external API keys needed. Returns deterministic responses — perfect for development and testing.

### OpenAI Provider

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
```

### Azure OpenAI Provider

```env
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

The app **always boots** with mock provider if no real keys are configured.

---

## Security & Auth

### API Key Authentication

All `/v1/*` endpoints require the `X-API-KEY` header:

```
X-API-KEY: your-secret-api-key
```

| Scenario       | Response                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| Missing header | `401 { error: { code: "UNAUTHORIZED", message: "Missing X-API-KEY header." } }` |
| Invalid key    | `401 { error: { code: "UNAUTHORIZED", message: "Invalid API key." } }`          |
| Valid key      | Request proceeds                                                                |

### Other Security Measures

- **CORS:** Configurable allow-list via `CORS_ORIGINS` (default: `*`)
- **Rate Limiting:** `RATE_LIMIT_PER_MINUTE` per IP (default: 60)
- **Helmet:** Security headers (XSS, HSTS, content-type sniffing, etc.)
- **Body Size Limit:** `MAX_BODY_SIZE_BYTES` (default: 1 MB)
- **Secrets:** API keys are never logged (masked in boot output)

---

## API Endpoints

All responses follow the shape `{ data, error }`.

### Public

| Method | Path            | Description                          |
| ------ | --------------- | ------------------------------------ |
| GET    | `/health`       | Server health, uptime, build version |
| GET    | `/openapi.json` | OpenAPI 3.1 specification            |
| GET    | `/docs`         | Swagger UI                           |

### Protected (X-API-KEY required)

| Method | Path                   | Description                                      |
| ------ | ---------------------- | ------------------------------------------------ |
| POST   | `/v1/chat/summarize`   | Summarize a conversation                         |
| POST   | `/v1/chat/insights`    | Extract sentiment, topics, entities, risks       |
| POST   | `/v1/resume/score`     | Score a resume (0–100) against a job description |
| POST   | `/v1/resume/improve`   | Get improvement suggestions + optimized version  |
| POST   | `/v1/content/generate` | Generate text content                            |

---

## Render Deployment

### Option A: Blueprint (render.yaml)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. Render will auto-generate a strong `API_KEY`
5. After deploy, note your URL (e.g., `https://ai-backend-platform.onrender.com`)

### Option B: Manual Setup

1. **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** `20` (set in Environment → `NODE_VERSION=20`)
4. **Environment Variables:**

   | Key                     | Value                               |
   | ----------------------- | ----------------------------------- |
   | `NODE_ENV`              | `production`                        |
   | `PORT`                  | `10000`                             |
   | `API_KEY`               | _(generate a strong random string)_ |
   | `AI_PROVIDER`           | `mock` (or `openai` / `azure`)      |
   | `CORS_ORIGINS`          | `*` (or your frontend URL)          |
   | `RATE_LIMIT_PER_MINUTE` | `60`                                |
   | `LOG_LEVEL`             | `info`                              |
   | `BUILD_VERSION`         | `1.0.0`                             |

   If using a real AI provider, also add the relevant `OPENAI_*` or `AZURE_OPENAI_*` keys.

5. **Health Check Path:** `/health`
6. Deploy!

### Post-Deployment Verification

```bash
# Health check (no auth)
curl https://your-app.onrender.com/health

# Protected endpoint
curl -X POST https://your-app.onrender.com/v1/chat/summarize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'

# Swagger UI
open https://your-app.onrender.com/docs
```

---

## OpenAPI / Swagger

- **Swagger UI:** `http://localhost:3000/docs`
- **OpenAPI JSON:** `http://localhost:3000/openapi.json`

To generate a static spec file:

```bash
npm run openapi:emit
# → openapi/openapi.json
```

The spec includes:

- All endpoint definitions with request/response schemas
- `apiKey` security scheme for `X-API-KEY`
- Server URL placeholders (local + Render)
- Tag-based grouping (Health, Chat, Resume, Content)

---

## Microsoft 365 Copilot Plugin Integration

A **plugin manifest scaffold** is included at `plugin-manifest.json`.

### Integration Checklist

1. **Deploy** the API to Render (or any public HTTPS endpoint)
2. **Update** `plugin-manifest.json`:
   - Replace `https://your-app.onrender.com` with your actual deployment URL
   - Update `contact_email`, `logo_url`, `legal_info_url`, `privacy_policy_url`
3. **Teams Developer Portal** ([dev.teams.microsoft.com](https://dev.teams.microsoft.com)):
   - Go to **Tools** → **API Plugins** (or Copilot extensions)
   - Upload the `plugin-manifest.json`
   - Configure the API key:
     - In the auth section, set the `X-API-KEY` header value to your deployed `API_KEY`
   - Point the OpenAPI URL to `https://your-app.onrender.com/openapi.json`
4. **Test** in Microsoft 365 Copilot:
   - Enable the plugin in the Copilot sidebar
   - Try prompts like "Summarize this conversation" or "Score this resume"

### Switching to OAuth 2.0 (Future)

When you're ready to move from API key to OAuth 2.0:

```jsonc
// In plugin-manifest.json, replace the auth section:
{
  "auth": {
    "type": "oauth2",
    "oauth2": {
      "authorization_url": "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize",
      "token_url": "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token",
      "scopes": {
        "api://{your-app-id}/access_as_user": "Access AI Backend Platform",
      },
    },
  },
}
```

Register an app in **Azure AD** → **App registrations**, configure redirect URIs, and update the manifest accordingly.

---

## How to Add a New Endpoint

Adding a new AI-powered endpoint follows a **repeatable 4-step pattern**:

### Step 1: Define Types (`src/types/index.ts`)

```typescript
// Add Zod schema for request validation
export const MyFeatureRequestSchema = z.object({
  input: z.string().min(1),
  option: z.enum(['a', 'b']).optional(),
});
export type MyFeatureRequest = z.infer<typeof MyFeatureRequestSchema>;

// Add result interface
export interface MyFeatureResult {
  output: string;
}
```

### Step 2: Add to AI Provider Interface (`src/types/index.ts`)

```typescript
export interface AIProvider {
  // ... existing methods
  myFeature(input: string, option?: string): Promise<MyFeatureResult>;
}
```

### Step 3: Implement in Providers

**Mock** (`src/services/ai/mock-provider.ts`):

```typescript
async myFeature(input: string, option?: string): Promise<MyFeatureResult> {
  return { output: `Mock result for: ${input}` };
}
```

**OpenAI** (`src/services/ai/openai-provider.ts`):

```typescript
async myFeature(input: string, option?: string): Promise<MyFeatureResult> {
  const { text } = await this.chat('System prompt...', input);
  return this.parseJson<MyFeatureResult>(text);
}
```

### Step 4: Create Route (`src/routes/my-feature/index.ts`)

```typescript
import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import { getAIProvider } from '../../services/ai/index.js';

export async function myFeatureRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  app.post(
    '/do-thing',
    {
      schema: {
        /* ... */
      },
    },
    async (request) => {
      const provider = getAIProvider();
      const result = await provider.myFeature(request.body.input);
      return { data: result };
    },
  );
}
```

Then register in `src/server.ts`:

```typescript
await app.register(myFeatureRoutes, { prefix: '/v1/my-feature' });
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

- **`test/unit/auth.test.ts`** — Auth guard (missing key, invalid key, valid key, public routes)
- **`test/unit/validation.test.ts`** — Zod schema validation (happy paths + error cases)
- **`test/unit/ai-mock.test.ts`** — Mock AI provider (all methods, deterministic outputs)
- **`test/integration/api.test.ts`** — Full endpoint tests (health, chat, resume, content)

---

## Sample Requests

### Health Check

```bash
curl http://localhost:3000/health
```

### Chat Summarize

```bash
curl -X POST http://localhost:3000/v1/chat/summarize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the main goals for Q1?"},
      {"role": "assistant", "content": "The main goals are: launch v2.0, expand to EU market, and improve retention by 15%."},
      {"role": "user", "content": "Great, let'\''s schedule a review meeting for those."}
    ],
    "style": "detailed"
  }'
```

### Chat Insights

```bash
curl -X POST http://localhost:3000/v1/chat/insights \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{
    "messages": [
      {"role": "user", "content": "I'\''m concerned about the project deadline."},
      {"role": "assistant", "content": "We can re-prioritize tasks to meet the deadline."}
    ],
    "signals": {"sentiment": true, "topics": true, "entities": true}
  }'
```

### Resume Score

```bash
curl -X POST http://localhost:3000/v1/resume/score \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{
    "resumeText": "Senior Software Engineer with 8 years of experience in TypeScript, Node.js, and cloud architecture. Built microservices handling 1M+ requests/day. Led a team of 5 engineers. Proficient in AWS, Docker, Kubernetes, and CI/CD pipelines.",
    "jobDescription": "Looking for a Staff Engineer with experience in distributed systems, TypeScript, cloud platforms, and team leadership."
  }'
```

### Resume Improve

```bash
curl -X POST http://localhost:3000/v1/resume/improve \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{
    "resumeText": "Developer with 3 years experience. Built web apps with JavaScript and React. Used databases.",
    "targetRole": "Full Stack Engineer"
  }'
```

### Content Generate

```bash
curl -X POST http://localhost:3000/v1/content/generate \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-to-a-strong-random-key" \
  -d '{
    "prompt": "Write a professional introduction paragraph for a tech blog about the future of AI in software development",
    "tone": "professional",
    "length": "medium"
  }'
```

### Without API Key (should return 401)

```bash
curl -X POST http://localhost:3000/v1/chat/summarize \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
# → 401 Unauthorized
```

---

## Troubleshooting

### Common Issues

| Problem                  | Solution                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| `401 Unauthorized`       | Check `X-API-KEY` header matches `API_KEY` in `.env`                |
| `429 Too Many Requests`  | Increase `RATE_LIMIT_PER_MINUTE` or wait for the window to reset    |
| `413 Payload Too Large`  | Increase `MAX_BODY_SIZE_BYTES` or reduce request body size          |
| `CORS errors` in browser | Set `CORS_ORIGINS` to your frontend URL (not `*` in production)     |
| App won't start          | Check `.env` has all required vars (at minimum `API_KEY`)           |
| AI returns mock data     | Set `AI_PROVIDER=openai` or `azure` and provide valid API keys      |
| TypeScript errors        | Run `npm run build` — check for type issues                         |
| Tests fail               | Ensure `npm install` is done; tests use mock provider automatically |

### Render-Specific Issues

| Problem               | Solution                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Deploy fails          | Check build logs; ensure `npm ci && npm run build` succeeds            |
| Health check fails    | Ensure `PORT` env var matches Render's expected port (usually `10000`) |
| 502 Bad Gateway       | App may be starting up; check logs for boot errors                     |
| Environment variables | Double-check all required vars are set in Render dashboard             |

---

## License

MIT — see [LICENSE](LICENSE) for details.
