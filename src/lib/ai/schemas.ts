// ---------------------------------------------------------------------------
// Zod Validation Schemas for AI Responses
// ---------------------------------------------------------------------------
// Validates JSON responses from the AI event planner, brainstorm, and
// marketing generators. All schemas use .passthrough() so unexpected extra
// fields from the AI do not cause validation failures.
//
// Aligned to REP v3.3 output format:
// - Event planner returns a wrapper object with events + calendarContext +
//   internalNotes + preflightCheck
// - Marketing returns comms kit + copy + designSpecs
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. AI-Generated Event (Full Plan mode)
// ---------------------------------------------------------------------------

const budgetEstimateSchema = z
  .object({
    tier: z.string(),
    amount: z.number().optional(),
    breakdown: z.string().optional(),
  })
  .passthrough()

export const aiGeneratedEventSchema = z
  .object({
    // Core identifiers
    name: z.string().min(1, 'Event name is required'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
    location: z.string().min(1, 'Location is required'),

    // Content
    description: z.string().min(1, 'Description is required'),
    whyItWorks: z.string().min(1, 'Internal rationale is required'),
    category: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).default([]),

    // Logistics
    setupAndSupplies: z.string().default(''),
    staffing: z.string().default(''),
    budgetEstimate: budgetEstimateSchema,
    weatherPlan: z.string().default(''),
    accessibilityNotes: z.string().default(''),
    measurementPlan: z.string().default(''),

    // Off-site flag
    isOffSite: z.boolean().default(false),
  })
  .passthrough()

export type AiGeneratedEvent = z.infer<typeof aiGeneratedEventSchema>

// ---------------------------------------------------------------------------
// 1b. Calendar Context (REP v3.3)
// ---------------------------------------------------------------------------

const calendarContextSchema = z
  .object({
    observancesInPeriod: z.array(z.string()).default([]),
    neighbourhoodAddOns: z.array(z.string()).default([]),
    verifiedLocalEvents: z.array(z.string()).default([]),
  })
  .passthrough()

export type AiCalendarContext = z.infer<typeof calendarContextSchema>

// ---------------------------------------------------------------------------
// 1c. Internal Notes (REP v3.3)
// ---------------------------------------------------------------------------

const internalNotesSchema = z
  .object({
    intakeSummary: z.string().default(''),
    amenitySources: z.string().default(''),
    residentMixSource: z.string().default(''),
    localSearchNotes: z.string().default(''),
    neighbourhoodNotes: z.string().default(''),
    complianceNotes: z.string().default(''),
    weatherAssumptions: z.string().default(''),
  })
  .passthrough()

export type AiInternalNotes = z.infer<typeof internalNotesSchema>

// ---------------------------------------------------------------------------
// 1d. Preflight Check (REP v3.3)
// ---------------------------------------------------------------------------

const preflightCheckSchema = z
  .object({
    residentMixConfirmed: z.boolean().default(true),
    amenitiesVerified: z.boolean().default(true),
    localContextIncluded: z.boolean().default(true),
    eventsFullyScoped: z.boolean().default(true),
    budgetAndFallbackPresent: z.boolean().default(true),
    allFactsLabeled: z.boolean().default(true),
    noInternalDataInPublicCopy: z.boolean().default(true),
    canadianEnglishConfirmed: z.boolean().default(true),
  })
  .passthrough()

export type AiPreflightCheck = z.infer<typeof preflightCheckSchema>

// ---------------------------------------------------------------------------
// 1e. Full Planner Response Wrapper (REP v3.3)
// ---------------------------------------------------------------------------
// The event planner now returns a wrapper object instead of a plain array.
// This includes the events plus calendar context, internal notes, and
// preflight check data.

export const aiPlannerResponseSchema = z
  .object({
    events: z.array(aiGeneratedEventSchema).min(1, 'At least one event is required'),
    calendarContext: calendarContextSchema.optional(),
    internalNotes: internalNotesSchema.optional(),
    preflightCheck: preflightCheckSchema.optional(),
    preflightWarnings: z.array(z.string()).optional(),
  })
  .passthrough()

export type AiPlannerResponse = z.infer<typeof aiPlannerResponseSchema>

// ---------------------------------------------------------------------------
// 2. AI Quick Idea (Quick Ideas / Brainstorm mode)
// ---------------------------------------------------------------------------

export const aiQuickIdeaSchema = z
  .object({
    name: z.string().min(1, 'Idea name is required'),
    description: z.string().min(1, 'Description is required'),
    suggestedLocation: z.string().default(''),
    category: z.string().default(''),
    whyItWorks: z.string().optional(),
    estimatedBudget: z.string().optional(),
  })
  .passthrough()

export type AiQuickIdea = z.infer<typeof aiQuickIdeaSchema>

// ---------------------------------------------------------------------------
// 3. AI Local Community Events Output
// ---------------------------------------------------------------------------

export const aiLocalEventSchema = z
  .object({
    name: z.string().min(1, 'Event name is required'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z
      .string()
      .optional()
      .transform((val) => {
        // Gracefully discard any non-HH:mm value the AI returns (e.g. "10:00 AM", "TBD", "varies")
        if (!val || !/^\d{2}:\d{2}$/.test(val)) return undefined
        return val
      }),
    endTime: z
      .string()
      .optional()
      .transform((val) => {
        // Gracefully discard any non-HH:mm value the AI returns (e.g. "5:00 PM", "TBD", "varies")
        if (!val || !/^\d{2}:\d{2}$/.test(val)) return undefined
        return val
      }),
    location: z.string().default(''),
    category: z
      .enum(['market', 'festival', 'arts', 'sports', 'community', 'other'])
      .default('community'),
    description: z.string().default(''),
    url: z.string().optional(),
    whyRelevant: z.string().optional(),
  })
  .passthrough()

export const aiLocalEventsResponseSchema = z.object({
  events: z.array(aiLocalEventSchema).min(1, 'At least one event is required'),
})

export type AiLocalEvent = z.infer<typeof aiLocalEventSchema>
export type AiLocalEventsResponse = z.infer<typeof aiLocalEventsResponseSchema>

// ---------------------------------------------------------------------------
// 4. AI Marketing Output
// ---------------------------------------------------------------------------

const posterCopySchema = z
  .object({
    hook: z.string().min(1, 'Poster hook is required'),
    cta: z.string().min(1, 'Poster CTA is required'),
    supportingText: z.string().default(''),
  })
  .passthrough()

// Design spec for a single marketing asset format (REP v3.3)
const designSpecSchema = z
  .object({
    format: z.string().min(1, 'Format name is required'),
    dimensions: z.string().default(''),
    headline: z.string().default(''),
    supportingText: z.string().default(''),
    layoutNotes: z.string().default(''),
    exportFormat: z.string().default(''),
  })
  .passthrough()

export type AiDesignSpec = z.infer<typeof designSpecSchema>

const campaignEmailSchema = z
  .object({
    subject: z.string().min(1),
    body: z.string().min(1),
  })
  .passthrough()

export const aiMarketingSchema = z
  .object({
    // Comms Kit
    emailSubjectLines: z
      .array(z.string())
      .min(1, 'At least one email subject line is required'),
    emailBody: z.string().min(1, 'Email body is required'),
    sms: z.string().min(1, 'SMS message is required'),

    // Marketing Copy
    posterCopy: posterCopySchema,
    socialCaptions: z
      .array(z.string())
      .min(1, 'At least one social caption is required'),
    visualPrompt: z.string().default(''),
    colorPalette: z.array(z.string()).default([]),
    iconSuggestions: z.array(z.string()).default([]),

    // Design Specifications (REP v3.3)
    designSpecs: z.array(designSpecSchema).default([]),

    // Campaign Email Sequence (pre → event-day → post-event)
    campaignSequence: z
      .object({
        invitation: campaignEmailSchema,
        reminder: campaignEmailSchema,
        thankYou: campaignEmailSchema,
      })
      .optional(),
  })
  .passthrough()

export type AiMarketingOutput = z.infer<typeof aiMarketingSchema>

// ---------------------------------------------------------------------------
// 4. AI Day-Of Checklist (Run-of-Show)
// ---------------------------------------------------------------------------

const aiChecklistItemSchema = z
  .object({
    text: z.string().min(1),
    category: z.enum(['setup', 'during', 'teardown']),
    dueTime: z.string().optional(),
    assignedTo: z.string().optional(),
  })
  .passthrough()

export const aiDayOfChecklistSchema = z
  .object({
    setup: z.array(aiChecklistItemSchema).default([]),
    during: z.array(aiChecklistItemSchema).default([]),
    teardown: z.array(aiChecklistItemSchema).default([]),
  })
  .passthrough()

export type AiDayOfChecklist = z.infer<typeof aiDayOfChecklistSchema>

// ---------------------------------------------------------------------------
// Schema for arrays of generated events / ideas
// ---------------------------------------------------------------------------

/** @deprecated Use aiPlannerResponseSchema instead for full plan mode */
export const aiGeneratedEventsArraySchema = z.array(aiGeneratedEventSchema)
export const aiQuickIdeasArraySchema = z.array(aiQuickIdeaSchema)

// ---------------------------------------------------------------------------
// Helper: parseAiResponse
// ---------------------------------------------------------------------------
// Strips markdown code fences, parses JSON, and validates against a schema.
// Returns a discriminated union so callers can handle success/failure cleanly.
// ---------------------------------------------------------------------------

export type ParseAiSuccess<T> = { success: true; data: T }
export type ParseAiFailure = { success: false; error: string }
export type ParseAiResult<T> = ParseAiSuccess<T> | ParseAiFailure

/**
 * Parse and validate an AI response string against a Zod schema.
 *
 * Handles common AI quirks:
 * - Strips markdown code fences (```json ... ```)
 * - Extracts JSON from surrounding prose text
 * - Strips leading/trailing whitespace
 * - Returns a user-friendly error message on failure
 */
export function parseAiResponse<T>(
  text: string,
  schema: z.ZodType<T>,
): ParseAiResult<T> {
  // 1. Try multiple extraction strategies to get valid JSON
  const extracted = extractJson(text)

  if (!extracted) {
    return {
      success: false,
      error:
        'The AI response was not valid JSON. This can happen with complex requests — please try again.',
    }
  }

  // 2. Attempt JSON parse
  let parsed: unknown
  try {
    parsed = JSON.parse(extracted)
  } catch {
    return {
      success: false,
      error:
        'The AI response was not valid JSON. This can happen with complex requests — please try again.',
    }
  }

  // 3. Validate with Zod
  const result = schema.safeParse(parsed)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // 4. Build a user-friendly error message from Zod issues
  const issueMessages = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    return `  - ${path}: ${issue.message}`
  })

  const detail =
    issueMessages.length <= 5
      ? issueMessages.join('\n')
      : [...issueMessages.slice(0, 5), `  ... and ${issueMessages.length - 5} more`].join('\n')

  return {
    success: false,
    error: `The AI response did not match the expected format:\n${detail}`,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract JSON from an AI response string.
 *
 * Tries multiple strategies in order:
 * 1. Strip markdown code fences (```json ... ```) — even with text before/after
 * 2. Find the outermost JSON object ({ ... }) or array ([ ... ]) in the text
 * 3. Use the raw trimmed text as-is
 *
 * Returns null if no valid JSON candidate can be found.
 */
function extractJson(text: string): string | null {
  const trimmed = text.trim()

  // Strategy 1: Extract content from markdown code fences (anywhere in text)
  const fenceRegex = /```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```/
  const fenceMatch = trimmed.match(fenceRegex)
  if (fenceMatch) {
    const candidate = fenceMatch[1].trim()
    if (isValidJsonCandidate(candidate)) return candidate
  }

  // Strategy 2: Raw text is already JSON
  if (isValidJsonCandidate(trimmed)) return trimmed

  // Strategy 3: Find the first outermost { ... } or [ ... ] in the text
  const jsonStart = findOutermostJson(trimmed)
  if (jsonStart) return jsonStart

  return null
}

/** Quick check: does the string start with { or [ ? */
function isValidJsonCandidate(s: string): boolean {
  return (s.startsWith('{') && s.endsWith('}')) ||
         (s.startsWith('[') && s.endsWith(']'))
}

/**
 * Find the outermost balanced JSON object or array in a string.
 * Handles cases where the model adds prose before or after the JSON.
 */
function findOutermostJson(text: string): string | null {
  // Find the first { or [
  const objStart = text.indexOf('{')
  const arrStart = text.indexOf('[')

  let startIdx: number
  let openChar: string
  let closeChar: string

  if (objStart === -1 && arrStart === -1) return null

  if (objStart === -1) {
    startIdx = arrStart; openChar = '['; closeChar = ']'
  } else if (arrStart === -1) {
    startIdx = objStart; openChar = '{'; closeChar = '}'
  } else if (objStart < arrStart) {
    startIdx = objStart; openChar = '{'; closeChar = '}'
  } else {
    startIdx = arrStart; openChar = '['; closeChar = ']'
  }

  // Walk through to find the matching close bracket, accounting for nesting and strings
  let depth = 0
  let inString = false
  let escape = false

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i]

    if (escape) {
      escape = false
      continue
    }

    if (ch === '\\' && inString) {
      escape = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return text.slice(startIdx, i + 1)
      }
    }
  }

  return null
}
