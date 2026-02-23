// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 3: Generating (Loading State)
// ---------------------------------------------------------------------------
// Shows skeleton event cards with shimmer animation and a rotating progress
// message while the AI generates events.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const PROGRESS_MESSAGES = [
  'Checking seasonal themes...',
  'Matching to resident preferences...',
  'Reviewing building amenities...',
  'Finalising event details...',
]

interface PlannerGeneratingProps {
  onCancel: () => void
}

export function PlannerGenerating({ onCancel }: PlannerGeneratingProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      {/* Progress message */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          Generating events...
        </div>
        <p className="text-sm text-text-secondary animate-pulse">
          {PROGRESS_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Skeleton event cards */}
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-4">
              {/* Title skeleton */}
              <div className="h-5 w-3/5 rounded bg-muted animate-pulse" />
              {/* Detail line skeletons */}
              <div className="space-y-2">
                <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              </div>
              {/* Badge skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancel button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
