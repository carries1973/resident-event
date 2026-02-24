import { useState } from 'react'
import { CalendarPlus, Wand2, X, MapPin, Check } from 'lucide-react'
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
  const [saved, setSaved] = useState(false)

  const handleSaveAsDraft = () => {
    if (saved) return
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
          <span className="text-text-muted italic">Date & time added after saving</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border-default mt-auto">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Check className="h-4 w-4" />
              Saved to Events
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-primary text-primary hover:bg-primary/10"
              onClick={handleSaveAsDraft}
              title="Save this idea as a draft event — add dates and details later in Events"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Save to Events
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={handleExpandToFullPlan}
            title="Use this as the starting point for a full AI-generated event plan with dates, budget, and logistics"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Build Full Plan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="ml-auto text-text-muted hover:text-danger"
            aria-label="Dismiss idea"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
