import { RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventMarketing } from '@/lib/types/event'

interface PosterCopyGeneratorProps {
  marketing: EventMarketing
  onRegenerateSection: (section: string) => void
  onGoToPoster?: () => void
}

/**
 * Displays poster copy (hook, supporting text, CTA) in a
 * visual preview layout with regeneration.
 */
export function PosterCopyGenerator({
  marketing,
  onRegenerateSection,
  onGoToPoster,
}: PosterCopyGeneratorProps) {
  const { posterCopy } = marketing

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Poster Copy
        </h3>
        <div className="flex items-center gap-2">
          {onGoToPoster && (
            <Button
              variant="outline"
              size="xs"
              onClick={onGoToPoster}
              className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
            >
              Poster tab
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onRegenerateSection('posterCopy')}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Visual poster preview */}
      <div className="mx-auto max-w-md rounded-xl border-2 border-dashed bg-muted/10 p-8 text-center space-y-6">
        {/* Hook headline */}
        <h2 className="text-2xl font-bold text-text-primary leading-tight">
          {posterCopy.hook}
        </h2>

        {/* Supporting text */}
        <p className="text-sm text-text-secondary leading-relaxed">
          {posterCopy.supportingText}
        </p>

        {/* CTA */}
        <div className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          {posterCopy.cta}
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        Simplified preview — switch to the{' '}
        {onGoToPoster ? (
          <button
            type="button"
            onClick={onGoToPoster}
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            Poster tab
          </button>
        ) : (
          'Poster tab'
        )}{' '}
        for the full branded layout and export.
      </p>
    </div>
  )
}
