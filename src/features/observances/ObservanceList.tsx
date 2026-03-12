import { Badge } from '@/components/ui/badge'
import { getMonthName } from '@/lib/utils/dates'
import type { Observance } from '@/lib/types/observance'

interface ObservanceListProps {
  observances: Observance[]
  disabledIds: string[]
  onToggle: (id: string) => void
  customIds?: Set<string>
  onRemoveCustom?: (id: string) => void
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  national: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  religious: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  theme: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  fun: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
}

const TYPE_LABELS: Record<string, string> = {
  national: 'National',
  cultural: 'Cultural',
  religious: 'Religious',
  theme: 'Theme',
  fun: 'Fun Day',
}

/**
 * ObservanceList — renders a list of observance rows.
 * Each row shows the emoji, name, type badge, date info, description,
 * event ideas, and a toggle to enable/disable the observance.
 * Custom observances additionally show a "Custom" badge and a remove button.
 */
export function ObservanceList({
  observances,
  disabledIds,
  onToggle,
  customIds,
  onRemoveCustom,
}: ObservanceListProps) {
  if (observances.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No observances match your current filters.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {observances.map((obs) => {
        const isDisabled = disabledIds.includes(obs.id)
        const isCustom = customIds?.has(obs.id) ?? false
        const dateLabel = obs.day
          ? `${getMonthName(obs.month)} ${obs.day}`
          : getMonthName(obs.month)

        return (
          <div
            key={obs.id}
            className={`flex items-start gap-4 rounded-lg border border-border-default bg-surface p-4 transition-opacity ${
              isDisabled ? 'opacity-60' : ''
            }`}
          >
            {/* Emoji */}
            <span className="text-2xl leading-none shrink-0 pt-0.5" aria-hidden="true">
              {obs.emoji}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Name + Badges + Date */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  {obs.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={TYPE_BADGE_STYLES[obs.type] ?? ''}
                >
                  {TYPE_LABELS[obs.type] ?? obs.type}
                </Badge>
                {isCustom && (
                  <Badge variant="outline" className="text-xs">
                    Custom
                  </Badge>
                )}
                <span className="text-xs text-text-muted">{dateLabel}</span>
              </div>

              {/* Description */}
              {obs.description && (
                <p className="text-sm text-text-secondary">{obs.description}</p>
              )}

              {/* Event Ideas */}
              {obs.eventIdeas && obs.eventIdeas.length > 0 && (
                <p className="text-xs text-text-muted">
                  <span className="font-medium">Event ideas:</span>{' '}
                  {obs.eventIdeas.join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Remove button for custom observances */}
              {isCustom && onRemoveCustom && (
                <button
                  type="button"
                  onClick={() => onRemoveCustom(obs.id)}
                  className="text-xs text-text-muted hover:text-danger transition-colors p-1"
                  aria-label={`Remove ${obs.name}`}
                  title="Remove custom observance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Toggle Button */}
              <button
                type="button"
                role="switch"
                aria-checked={!isDisabled}
                aria-label={`${isDisabled ? 'Enable' : 'Disable'} ${obs.name}`}
                onClick={() => onToggle(obs.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isDisabled
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-brand'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    isDisabled ? 'translate-x-0.5' : 'translate-x-5'
                  }`}
                />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
