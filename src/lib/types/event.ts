import type {
  UUID, ISODate, ISODateTime, TimeString,
  BudgetTier, EventStatus, EventSource, RecurrenceType,
  ChecklistItem, StaffRole, RSVPEntry,
} from './common'

export interface EventCloseout {
  actualAttendance: number
  expectedAttendance: number
  actualCost: number
  budgetedCost: number
  feedbackSummary: string
  lessonsLearned: string
  photosShared: boolean
  thankYousSent: boolean
  completedAt: ISODateTime
}

export interface MarketingDesignSpec {
  format: string                  // e.g., "Instagram Post", "Email Header", "Flyer 8.5x11"
  dimensions: string              // e.g., "1080x1080px", "600x200px"
  headline: string
  supportingText: string
  layoutNotes: string
  exportFormat: string            // e.g., "PNG for social", "PDF Print for flyers"
}

export interface CampaignEmail {
  subject: string
  body: string
}

export interface EventMarketing {
  emailSubjectLines: string[]     // 5 options (varied approaches)
  emailBody: string               // ≤150 words
  sms: string                     // ≤160 chars
  posterCopy: {
    hook: string
    cta: string
    supportingText: string
  }
  socialCaptions: string[]        // 3 captions
  visualPrompt: string            // DALL-E / Canva prompt
  colorPalette: string[]
  iconSuggestions: string[]
  designSpecs?: MarketingDesignSpec[]  // REP v3.3 design specifications
  campaignSequence?: {            // Full pre→post campaign email sequence
    invitation: CampaignEmail     // Sent 7-10 days before event
    reminder: CampaignEmail       // Sent 1-2 days before
    thankYou: CampaignEmail       // Sent 24-48 hours after
  }
}

export interface BudgetEstimate {
  tier: BudgetTier
  amount?: number
  breakdown?: string
}

export interface Event {
  id: UUID
  buildingId: string               // FK to Building
  buildingIds?: string[]           // For portfolio/multi-building events

  // Core
  name: string
  date: ISODate                    // YYYY-MM-DD
  startTime: TimeString            // HH:mm
  endTime: TimeString
  location: string                 // e.g., "Rooftop Patio"

  // Content
  description: string              // Resident-facing
  whyItWorks: string               // Internal rationale
  category: string                 // e.g., "Wellness", "Community"
  tags: string[]

  // Visuals
  coverImage?: string              // Data URL or external URL
  photos?: string[]                // Post-event photos

  // Recurrence
  recurrence: RecurrenceType
  recurrenceEndDate?: ISODate
  recurrenceParentId?: UUID

  // Logistics
  setupAndSupplies: string
  staffing: string
  budgetEstimate: BudgetEstimate
  weatherPlan: string
  accessibilityNotes: string

  // Lifecycle
  status: EventStatus

  // Day-Of
  dayOfChecklist: ChecklistItem[]
  staffRoles: StaffRole[]

  // Closeout
  closeout?: EventCloseout

  // Marketing
  marketing?: EventMarketing

  // RSVP
  rsvpEnabled: boolean
  rsvpLimit?: number
  rsvpCount: number
  rsvpList: RSVPEntry[]
  rsvpWaitlist: RSVPEntry[]

  // Measurement
  measurementPlan: string

  // Source tracking
  source: EventSource
  aiGenerated: boolean
  aiOriginal?: object              // Original AI output for comparison

  // Meta
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/** Creates a new event with defaults */
export function createDefaultEvent(overrides: Partial<Event> & Pick<Event, 'name' | 'buildingId'>): Event {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    whyItWorks: '',
    category: '',
    tags: [],
    recurrence: 'none',
    setupAndSupplies: '',
    staffing: '',
    budgetEstimate: { tier: 'moderate' },
    weatherPlan: '',
    accessibilityNotes: '',
    status: 'draft',
    dayOfChecklist: [],
    staffRoles: [],
    rsvpEnabled: false,
    rsvpCount: 0,
    rsvpList: [],
    rsvpWaitlist: [],
    measurementPlan: '',
    source: 'manual',
    aiGenerated: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
