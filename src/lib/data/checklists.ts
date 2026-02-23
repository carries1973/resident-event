import type { ChecklistItem } from '../types/common'

/** Template checklist items — cloned when creating a new event */
export const PRE_EVENT_CHECKLIST: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  { text: 'Define objectives and target audience', category: 'setup' },
  { text: 'Review past event feedback', category: 'setup' },
  { text: 'Allocate budget with contingency', category: 'setup' },
  { text: 'Research and contact vendors', category: 'setup' },
  { text: 'Select and book venue/amenity space', category: 'setup' },
  { text: 'Confirm permits and insurance if needed', category: 'setup' },
  { text: 'Create event schedule with buffer time', category: 'setup' },
  { text: 'Launch promotional materials (email, social, flyers)', category: 'setup' },
  { text: 'Set up RSVP / registration', category: 'setup' },
  { text: 'Schedule automated reminders', category: 'setup' },
]

export const DAY_OF_CHECKLIST: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  { text: 'Set up venue (seating, decorations, AV, signage)', category: 'setup' },
  { text: 'Confirm vendor deliveries and check quality', category: 'setup' },
  { text: 'Brief staff and assign roles', category: 'setup' },
  { text: 'Verify safety protocols (fire codes, first aid, accessibility)', category: 'setup' },
  { text: 'Set up registration / check-in desk', category: 'setup' },
  { text: 'Facilitate engagement activities', category: 'during' },
  { text: 'Monitor time and keep schedule on track', category: 'during' },
  { text: 'Take photos and videos for social media', category: 'during' },
  { text: 'Address any issues or guest requests', category: 'during' },
  { text: 'Begin teardown and venue restoration', category: 'teardown' },
  { text: 'Collect lost and found items', category: 'teardown' },
  { text: 'Thank vendors and volunteers', category: 'teardown' },
]

export const POST_EVENT_CHECKLIST: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  { text: 'Complete venue restoration', category: 'teardown' },
  { text: 'Distribute feedback survey to attendees', category: 'teardown' },
  { text: 'Hold team debriefing', category: 'teardown' },
  { text: 'Reconcile budget (actual vs. planned)', category: 'teardown' },
  { text: 'Calculate ROI and impact metrics', category: 'teardown' },
  { text: 'Share photos and recap on social media', category: 'teardown' },
  { text: 'Send thank-you notes to attendees and vendors', category: 'teardown' },
]

/** Generate checklist items with unique IDs from a template */
export function generateChecklistFromTemplate(
  template: Omit<ChecklistItem, 'id' | 'completed'>[]
): ChecklistItem[] {
  return template.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    completed: false,
  }))
}
