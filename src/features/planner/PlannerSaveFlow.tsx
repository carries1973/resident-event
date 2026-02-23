// ---------------------------------------------------------------------------
// Full Plan Wizard — Save Flow
// ---------------------------------------------------------------------------
// Saves selected AI-generated events as draft events in the event store.
// Shows a brief saving indicator and fires a toast on completion.
// Navigation is handled by the parent (PlannerPage) via onComplete.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { useEventStore } from '@/lib/store/eventStore'
import type { AiGeneratedEvent } from '@/lib/ai/schemas'
import type { Building } from '@/lib/types/building'

interface PlannerSaveFlowProps {
  events: AiGeneratedEvent[]
  building: Building
  onComplete: () => void
}

export function PlannerSaveFlow({
  events,
  building,
  onComplete,
}: PlannerSaveFlowProps) {
  const createEvent = useEventStore((s) => s.createEvent)
  const hasSaved = useRef(false)

  useEffect(() => {
    // Guard against double-execution in StrictMode
    if (hasSaved.current) return
    if (events.length === 0) return
    hasSaved.current = true

    for (const event of events) {
      createEvent({
        name: event.name,
        buildingId: building.id,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
        whyItWorks: event.whyItWorks,
        category: event.category,
        tags: event.tags ?? [],
        setupAndSupplies: event.setupAndSupplies ?? '',
        staffing: event.staffing ?? '',
        budgetEstimate: {
          tier: (event.budgetEstimate?.tier as 'low' | 'moderate' | 'premium') ?? 'moderate',
          amount: event.budgetEstimate?.amount,
          breakdown: event.budgetEstimate?.breakdown,
        },
        weatherPlan: event.weatherPlan ?? '',
        accessibilityNotes: event.accessibilityNotes ?? '',
        measurementPlan: event.measurementPlan ?? '',
        source: 'ai_planner',
        aiGenerated: true,
        aiOriginal: event,
      })
    }

    const count = events.length
    toast.success(
      `Saved ${count} ${count === 1 ? 'event' : 'events'} as drafts! View them on the Calendar or Events page.`,
    )

    // Let the parent handle navigation and state cleanup
    // Use a small timeout so the toast is visible before navigating away
    setTimeout(() => {
      onComplete()
    }, 300)
  }, [events, building, createEvent, onComplete])

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-text-primary">
          Saving {events.length} {events.length === 1 ? 'event' : 'events'} to{' '}
          {building.name}...
        </p>
      </CardContent>
    </Card>
  )
}
