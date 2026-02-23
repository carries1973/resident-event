import type { UUID, ObservanceType } from './common'

export interface Observance {
  id: UUID
  name: string
  month: number                    // 1-12
  day?: number                     // If specific date; undefined = month-long
  type: ObservanceType
  emoji: string
  description?: string
  eventIdeas?: string[]            // Suggested event tie-ins
  enabled: boolean                 // User can toggle on/off
}
