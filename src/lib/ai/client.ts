// ---------------------------------------------------------------------------
// AI Client — Claude (Anthropic) Only
// ---------------------------------------------------------------------------
// Handles two runtime modes:
//   DEV  – direct browser fetch to Anthropic API using VITE_ANTHROPIC_API_KEY
//   PROD – proxied through a Vercel serverless function at /api/generate
// ---------------------------------------------------------------------------

export interface GenerateAIParams {
  systemPrompt: string;
  userMessage: string;
  temperature?: number; // default 0.7
  maxTokens?: number; // default 8192
}

export interface GenerateAIResult {
  text: string;
}

// ---------------------------------------------------------------------------
// Custom error class for AI-related failures
// ---------------------------------------------------------------------------

export class AiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'AiError';
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateAI(
  params: GenerateAIParams,
): Promise<GenerateAIResult> {
  // In production, all requests go through the serverless proxy which holds
  // the API key server-side.
  if (import.meta.env.PROD) {
    return generateViaProxy(params);
  }

  // In development, call the Anthropic API directly from the browser.
  return generateViaClaude(params);
}

// ---------------------------------------------------------------------------
// Production — Vercel serverless proxy
// ---------------------------------------------------------------------------

async function generateViaProxy(
  params: GenerateAIParams,
): Promise<GenerateAIResult> {
  let response: Response;

  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'claude',
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      }),
    });
  } catch {
    throw new AiError(
      'Network error — check your connection and try again.',
    );
  }

  const body = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      body?.error ?? `Server error (${response.status}). Please try again.`;
    throw new AiError(message, response.status);
  }

  if (!body?.text) {
    throw new AiError('Unexpected response from server — missing text field.');
  }

  return { text: body.text };
}

// ---------------------------------------------------------------------------
// Dev — Anthropic (Claude) direct
// ---------------------------------------------------------------------------

async function generateViaClaude(
  params: GenerateAIParams,
): Promise<GenerateAIResult> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!key) {
    throw new AiError(
      'Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in .env',
    );
  }

  let response: Response;

  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: params.maxTokens ?? 8192,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userMessage }],
      }),
    });
  } catch {
    throw new AiError(
      'Network error — check your connection and try again.',
    );
  }

  if (response.status === 429) {
    throw new AiError(
      'Rate limit reached. Please wait a moment and try again.',
      429,
    );
  }

  const body = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      body?.error?.message ??
      body?.error ??
      `Anthropic API error (${response.status}). Please try again.`;
    throw new AiError(message, response.status);
  }

  const text = body?.content?.[0]?.text;

  if (typeof text !== 'string') {
    throw new AiError(
      'Unexpected response from Anthropic — could not extract text.',
    );
  }

  return { text };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the Anthropic API key is available.
 *
 * In production the key lives server-side, so this always returns true.
 * In development it inspects the VITE_ANTHROPIC_API_KEY env variable.
 */
export function isAiConfigured(): boolean {
  if (import.meta.env.PROD) {
    return true;
  }

  return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
