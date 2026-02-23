// ---------------------------------------------------------------------------
// Vercel Serverless Function — /api/generate
// ---------------------------------------------------------------------------
// Proxies AI requests to Anthropic (Claude) so the API key stays server-side.
// Reads ANTHROPIC_API_KEY from Vercel environment variables
// (set in Dashboard → Project → Settings → Environment Variables).
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory rate limiting (resets when the function cold-starts)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// ---------------------------------------------------------------------------
// Request body shape (matches GenerateAIParams from client.ts)
// ---------------------------------------------------------------------------

interface RequestBody {
  provider: 'claude'
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxTokens?: number
}

function isValidBody(body: unknown): body is RequestBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    b.provider === 'claude' &&
    typeof b.systemPrompt === 'string' &&
    typeof b.userMessage === 'string'
  )
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CORS — same-origin only (Vercel sets the origin header automatically)
  const origin = req.headers.origin ?? ''
  const host = req.headers.host ?? ''
  if (origin && !origin.includes(host)) {
    return res.status(403).json({ error: 'Forbidden — cross-origin request' })
  }

  // Rate limiting
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown'

  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: 'Rate limit reached. Please wait a moment and try again.' })
  }

  // Validate body
  if (!isValidBody(req.body)) {
    return res.status(400).json({
      error:
        'Invalid request body. Expected: { provider: "claude", systemPrompt, userMessage }',
    })
  }

  const { systemPrompt, userMessage, temperature = 0.7, maxTokens = 8192 } =
    req.body

  try {
    const text = await callClaude(systemPrompt, userMessage, temperature, maxTokens)
    return res.status(200).json({ text })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('[/api/generate] Error:', message)
    return res.status(502).json({ error: message })
  }
}

// ---------------------------------------------------------------------------
// Anthropic (Claude)
// ---------------------------------------------------------------------------

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY not configured. Set it in Vercel environment variables.',
    )
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const body = await safeJson(response)
    const msg =
      body?.error?.message ?? `Anthropic API error (${response.status})`
    throw new Error(msg)
  }

  const body = await response.json()
  const text = body?.content?.[0]?.text

  if (typeof text !== 'string') {
    throw new Error('Unexpected Anthropic response shape')
  }

  return text
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json()
  } catch {
    return null
  }
}
