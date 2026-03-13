import { useState } from 'react'
import { CalendarPlus, Wand2, X, MapPin, Check, Lightbulb, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEventStore } from '@/lib/store/eventStore'
import type { AiQuickIdea } from '@/lib/ai/schemas'
import type { Building } from '@/lib/types/building'

interface QuickIdeaCardProps {
  idea: AiQuickIdea
  building: Building
  onDismiss: () => void
  onExpandToFullPlan?: (idea: AiQuickIdea) => void
}

export function QuickIdeaCard({ idea, building, onDismiss, onExpandToFullPlan }: QuickIdeaCardProps) {
  const createEvent = useEventStore((s) => s.createEvent)
  const events = useEventStore((s) => s.events)

  // Initialise from store so resuming a session doesn't re-show the Save button
  // for ideas that were already saved in a previous page load.
  const alreadySaved = events.some(
    (e) => e.name === idea.name && e.buildingId === building.id && e.source === 'brainstorm',
  )
  const [saved, setSaved] = useState(alreadySaved)

  const handleSaveAsDraft = () => {
    if (saved) return
    // Guard against double-save (e.g. rapid double-click)
    const duplicate = events.some(
      (e) => e.name === idea.name && e.buildingId === building.id && e.source === 'brainstorm',
    )
    if (duplicate) {
      setSaved(true)
      return
    }
    createEvent({
      name: idea.name,
      buildingId: building.id,
      description: idea.description,
      location: idea.suggestedLocation || '',
      category: idea.category || '',
      source: 'brainstorm',
      aiGenerated: true,
    })
    setSaved(true)
  }

  const handleExpandToFullPlan = () => {
    if (onExpandToFullPlan) {
      onExpandToFullPlan(idea)
    }
  }

  return (
    <Card className="group hover:border-primary/30 transition-colors flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Name */}
        <h3 className="text-base font-semibold text-text-primary leading-snug">
          {idea.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed flex-1">
          {idea.description}
        </p>

        {/* Why it works */}
        {idea.whyItWorks && (
          <div className="flex items-start gap-1.5 text-xs text-text-muted bg-surface-hover rounded-md px-2.5 py-1.5">
            <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <span>{idea.whyItWorks}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          {idea.suggestedLocation && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {idea.suggestedLocation}
            </Badge>
          )}
          {idea.category && (
            <Badge variant="outline">{idea.category}</Badge>
          )}
          {idea.estimatedBudget && (
            <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30">
              <DollarSign className="h-3 w-3" />
              {idea.estimatedBudget}
            </Badge>
          )}
          <span className="text-text-muted italic">Date & time added after saving</span>
        </div>

        {/* Actions */}
        <div className="pt-1 border-t border-border-default mt-auto space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <Check className="h-4 w-4" />
                Saved to Events
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-primary text-primary hover:bg-primary/10 flex-1 min-w-0"
                onClick={handleSaveAsDraft}
                title="Save this idea as a draft event — add dates and details later in Events"
              >
                <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Save to Events</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 flex-1 min-w-0"
              onClick={handleExpandToFullPlan}
              title="Use this as the starting point for a full AI-generated event plan with dates, budget, and logistics"
            >
              <Wand2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Build Full Plan</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-text-muted hover:text-danger shrink-0"
              aria-label="Dismiss idea"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
