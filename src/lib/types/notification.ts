import type { UUID, ISODateTime } from './common'

export type NotificationType = 'event_reminder' | 'closeout_due' | 'rsvp_alert' | 'rsvp_full' | 'system'

export interface AppNotification {
  id: UUID
  type: NotificationType
  title: string
  message: string
  eventId?: string
  buildingId?: string
  read: boolean
  createdAt: ISODateTime
}
