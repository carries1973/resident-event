/**
 * Notification engine — pure function that generates notifications
 * from current event state. Run on app load + every 5 minutes.
 * De-duplicates by eventId + type to avoid repeat alerts.
 */

import type { Event } from '../types/event'
import type { AppNotification, NotificationType } from '../types/notification'
import { computeEventStatus } from '../store/eventStore'
import { daysUntil, formatDate } from '../utils/dates'

interface ExistingNotification {
  eventId?: string
  type: NotificationType
}

/**
 * Generate new notifications based on current event state.
 * Skips any notifications that already exist (by eventId + type).
 */
export function generateNotifications(
  events: Event[],
  existing: ExistingNotification[],
): AppNotification[] {
  const now = new Date().toISOString()
  const notifications: AppNotification[] = []

  /** Check if a notification already exists */
  function alreadyExists(eventId: string, type: NotificationType): boolean {
    return existing.some((n) => n.eventId === eventId && n.type === type)
  }

  for (const event of events) {
    const status = computeEventStatus(event)

    // 1. Event in next 48 hours — reminder
    if (
      (status === 'scheduled' || status === 'active') &&
      event.date
    ) {
      const days = daysUntil(event.date)
      if (days >= 0 && days <= 2 && !alreadyExists(event.id, 'event_reminder')) {
        const timeText =
          days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
        notifications.push({
          id: crypto.randomUUID(),
          type: 'event_reminder',
          title: `Upcoming: ${event.name}`,
          message: `${event.name} is ${timeText}${event.date ? ` (${formatDate(event.date)})` : ''}. Make sure everything is ready!`,
          eventId: event.id,
          buildingId: event.buildingId,
          read: false,
          createdAt: now,
        })
      }
    }

    // 2. Event passed without closeout (3+ days overdue)
    if (status === 'needs_closeout' && event.date) {
      const days = daysUntil(event.date)
      if (days <= -3 && !alreadyExists(event.id, 'closeout_due')) {
        notifications.push({
          id: crypto.randomUUID(),
          type: 'closeout_due',
          title: `Closeout needed: ${event.name}`,
          message: `${event.name} ended ${Math.abs(days)} days ago and still needs closeout. Complete it to track your results.`,
          eventId: event.id,
          buildingId: event.buildingId,
          read: false,
          createdAt: now,
        })
      }
    }

    // 3. RSVP at 80% capacity
    if (
      event.rsvpEnabled &&
      event.rsvpLimit != null &&
      event.rsvpLimit > 0
    ) {
      const percentage = event.rsvpCount / event.rsvpLimit

      if (
        percentage >= 0.8 &&
        percentage < 1 &&
        !alreadyExists(event.id, 'rsvp_alert')
      ) {
        notifications.push({
          id: crypto.randomUUID(),
          type: 'rsvp_alert',
          title: `Almost full: ${event.name}`,
          message: `${event.rsvpCount} of ${event.rsvpLimit} spots filled for ${event.name}. Consider expanding capacity or closing RSVPs soon.`,
          eventId: event.id,
          buildingId: event.buildingId,
          read: false,
          createdAt: now,
        })
      }

      // 4. RSVP at capacity
      if (percentage >= 1 && !alreadyExists(event.id, 'rsvp_full')) {
        notifications.push({
          id: crypto.randomUUID(),
          type: 'rsvp_full',
          title: `RSVP full: ${event.name}`,
          message: `${event.name} has reached its RSVP limit of ${event.rsvpLimit}. ${event.rsvpWaitlist.length} people are on the waitlist.`,
          eventId: event.id,
          buildingId: event.buildingId,
          read: false,
          createdAt: now,
        })
      }
    }
  }

  return notifications
}
