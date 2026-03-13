/**
 * LocalEventsPage — AI-powered local community event discovery.
 *
 * Flow:
 *  1. Select building + date range
 *  2. "Discover Events" → Claude generates plausible local events for that city/period
 *  3. Review the suggested events (accept / dismiss per item)
 *  4. "Save Selected" → stores accepted events in localEventStore
 *
 * Saved events appear on the calendar in amber alongside in-building events.
 */

import { useState, useMemo } from 'react'
import {
  Sparkles,
  MapPin,
  ExternalLink,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useLocalEventStore, useLocalEventStoreHydrated } from '@/lib/store/localEventStore'
import { useBuildingStore, useBuildingStoreHydrated } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import {
  type LocalEvent,
  LOCAL_EVENT_CATEGORY_LABELS,
  LOCAL_EVENT_COLOUR,
} from '@/lib/types/localEvent'
import { generateAI, isAiConfigured } from '@/lib/ai/client'
import { buildLocalEventsPrompt } from '@/lib/ai/prompts/localEvents'
import { parseAiResponse } from '@/lib/ai/schemas'
import { aiLocalEventsResponseSchema } from '@/lib/ai/schemas'
import type { AiLocalEvent } from '@/lib/ai/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Default date range: today → +60 days */
function defaultRange() {
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() + 60)
  return {
    start: today.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

// ── Suggested event card ──────────────────────────────────────────────────────

interface SuggestedCardProps {
  event: AiLocalEvent & { _selected: boolean }
  onToggle: () => void
}

function SuggestedCard({ event, onToggle }: SuggestedCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        event._selected
          ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-700'
          : 'border-border-default bg-surface opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Select toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0"
          aria-label={event._selected ? 'Deselect event' : 'Select event'}
        >
          {event._selected ? (
            <CheckCircle2 className="h-5 w-5 text-amber-500" />
          ) : (
            <XCircle className="h-5 w-5 text-text-muted" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('font-medium text-sm leading-5', event._selected ? 'text-text-primary' : 'text-text-muted')}>
              {event.name}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-text-muted hover:text-text-secondary"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-text-muted">
            <span className="font-medium text-text-secondary">{formatDisplayDate(event.date)}</span>

            {event.startTime && (
              <span>
                {formatTime(event.startTime)}
                {event.endTime && ` – ${formatTime(event.endTime)}`}
              </span>
            )}

            <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-medium', LOCAL_EVENT_COLOUR.badge)}>
              {LOCAL_EVENT_CATEGORY_LABELS[event.category as keyof typeof LOCAL_EVENT_CATEGORY_LABELS] ?? event.category}
            </span>

            {event.location && (
              <span className="flex items-center gap-0.5 truncate max-w-[160px]">
                <MapPin className="h-3 w-3 shrink-0" />
                {event.location}
              </span>
            )}
          </div>

          {expanded && event.description && (
            <p className="mt-1.5 text-xs text-text-muted">{event.description}</p>
          )}
          {expanded && (event as AiLocalEvent & { whyRelevant?: string }).whyRelevant && (
            <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded px-2 py-1">
              <span className="font-semibold">Why it matters for your residents: </span>
              {(event as AiLocalEvent & { whyRelevant?: string }).whyRelevant}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Saved event card ──────────────────────────────────────────────────────────

interface SavedCardProps {
  event: LocalEvent
  onDelete: () => void
}

function SavedCard({ event, onDelete }: SavedCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-3 flex items-start gap-3 group',
      'bg-surface border-amber-200 dark:border-amber-800/60',
    )}>
      <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-text-primary text-sm">{event.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{formatDisplayDate(event.date)}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-danger hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={onDelete}
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
          <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-medium', LOCAL_EVENT_COLOUR.badge)}>
            {LOCAL_EVENT_CATEGORY_LABELS[event.category]}
          </span>
          {event.startTime && (
            <span>
              {formatTime(event.startTime)}
              {event.endTime && ` – ${formatTime(event.endTime)}`}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-0.5 truncate max-w-[160px]">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          )}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-brand hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Info
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type PageState = 'idle' | 'generating' | 'results' | 'error'

export function LocalEventsPage() {
  const buildingsHydrated = useBuildingStoreHydrated()
  const hydrated = useLocalEventStoreHydrated()
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)

  const localEvents = useLocalEventStore((s) => s.localEvents)
  const createLocalEvent = useLocalEventStore((s) => s.createLocalEvent)
  const deleteLocalEvent = useLocalEventStore((s) => s.deleteLocalEvent)

  const range = defaultRange()
  const [buildingId, setBuildingId] = useState<string>('')
  const [startDate, setStartDate] = useState(range.start)
  const [endDate, setEndDate] = useState(range.end)

  const [pageState, setPageState] = useState<PageState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // suggested events from AI, each with a _selected flag
  const [suggested, setSuggested] = useState<Array<AiLocalEvent & { _selected: boolean }>>([])

  // Resolve buildingId once store hydrates
  const resolvedBuildingId = useMemo(() => {
    if (buildingId) return buildingId
    if (!buildingsHydrated) return ''
    return currentBuildingId ?? buildings[0]?.id ?? ''
  }, [buildingId, buildingsHydrated, currentBuildingId, buildings])

  const building = buildings.find((b) => b.id === resolvedBuildingId)

  const aiConfigured = isAiConfigured()

  // Saved events sorted: upcoming first, then past
  const today = new Date().toISOString().slice(0, 10)
  const savedUpcoming = [...localEvents]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const savedPast = [...localEvents]
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const selectedCount = suggested.filter((e) => e._selected).length

  async function handleGenerate() {
    if (!building) return
    setPageState('generating')
    setErrorMsg('')
    setSuggested([])

    try {
      const { systemPrompt, userMessage } = buildLocalEventsPrompt({
        building,
        startDate,
        endDate,
      })

      const result = await generateAI({ systemPrompt, userMessage, temperature: 0.6, maxTokens: 2000 })
      const parsed = parseAiResponse(result.text, aiLocalEventsResponseSchema)

      if (!parsed.success) {
        throw new Error(parsed.error ?? 'Could not parse AI response.')
      }

      const events = parsed.data.events.map((e) => ({ ...e, _selected: true }))
      setSuggested(events)
      setPageState('results')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setPageState('error')
    }
  }

  function toggleSelected(idx: number) {
    setSuggested((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, _selected: !e._selected } : e)),
    )
  }

  function selectAll() {
    setSuggested((prev) => prev.map((e) => ({ ...e, _selected: true })))
  }

  function selectNone() {
    setSuggested((prev) => prev.map((e) => ({ ...e, _selected: false })))
  }

  function handleSaveSelected() {
    const toSave = suggested.filter((e) => e._selected)
    if (toSave.length === 0) return

    for (const e of toSave) {
      createLocalEvent({
        name: e.name,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location ?? '',
        category: (e.category as LocalEvent['category']) ?? 'community',
        description: e.description,
        url: e.url,
      })
    }

    toast.success(`${toSave.length} event${toSave.length === 1 ? '' : 's'} added to your calendar`)
    setSuggested([])
    setPageState('idle')
  }

  if (!buildingsHydrated || !hydrated) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <div className="h-8 w-48 rounded bg-surface-hover animate-pulse" />
        <div className="h-4 w-72 rounded bg-surface-hover animate-pulse" />
      </div>
    )
  }

  if (buildings.length === 0) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-10 w-10 text-text-muted mb-4" />
        <p className="text-text-secondary">Add a building first to discover local events.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Local Events</h1>
        <p className="text-sm text-text-muted mt-1">
          Discover community events happening near your building — farmers markets, festivals,
          street fairs, and more. They appear on your calendar in{' '}
          <span className="font-medium text-amber-600 dark:text-amber-400">amber</span>{' '}
          alongside your in-building events.
        </p>
      </div>

      {/* Discovery panel */}
      <div className="rounded-xl border border-border-default bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">Discover events</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Building */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Building</label>
            <Select
              value={resolvedBuildingId}
              onValueChange={(v) => { setBuildingId(v); setSuggested([]); setPageState('idle') }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setSuggested([]); setPageState('idle') }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">To</label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setSuggested([]); setPageState('idle') }}
            />
          </div>
        </div>

        {building && (
          <p className="text-xs text-text-muted flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            Discovering events in <span className="font-medium text-text-secondary ml-0.5">{building.city}, {building.province}</span>
          </p>
        )}

        {!aiConfigured && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            AI not configured — set <code className="font-mono">VITE_ANTHROPIC_API_KEY</code> in your .env to enable event discovery.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!resolvedBuildingId || !startDate || !endDate || !aiConfigured || pageState === 'generating'}
            className="gap-2"
          >
            {pageState === 'generating' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Discovering…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Discover Events
              </>
            )}
          </Button>
          {pageState === 'results' && (
            <Button variant="outline" onClick={handleGenerate} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Generating skeleton */}
      {pageState === 'generating' && (
        <div className="space-y-2">
          <p className="text-sm text-text-muted italic">Finding community events in {building?.city}…</p>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border border-border-default bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {pageState === 'error' && (
        <div className="rounded-xl border border-danger/30 bg-red-50 dark:bg-red-950/20 p-4 space-y-2">
          <p className="text-sm font-medium text-danger">Could not generate events</p>
          <p className="text-xs text-text-muted">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )}

      {/* Results */}
      {pageState === 'results' && suggested.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              {suggested.length} suggested events
              <span className="text-text-muted font-normal ml-1.5">
                — {selectedCount} selected
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 px-2">
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs h-7 px-2">
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {suggested.map((event, idx) => (
              <SuggestedCard
                key={`${event.name}-${event.date}-${idx}`}
                event={event}
                onToggle={() => toggleSelected(idx)}
              />
            ))}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={handleSaveSelected}
              disabled={selectedCount === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Save {selectedCount > 0 ? `${selectedCount} event${selectedCount === 1 ? '' : 's'}` : 'selected'}
            </Button>
            <Button variant="ghost" onClick={() => { setSuggested([]); setPageState('idle') }}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Saved events */}
      {localEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Saved — {localEvents.length} event{localEvents.length === 1 ? '' : 's'} on calendar
            </h2>
          </div>

          {savedUpcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Upcoming</p>
              {savedUpcoming.map((event) => (
                <SavedCard
                  key={event.id}
                  event={event}
                  onDelete={() => {
                    deleteLocalEvent(event.id)
                    toast.success(`"${event.name}" removed`)
                  }}
                />
              ))}
            </div>
          )}

          {savedPast.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Past</p>
              {savedPast.map((event) => (
                <SavedCard
                  key={event.id}
                  event={event}
                  onDelete={() => {
                    deleteLocalEvent(event.id)
                    toast.success(`"${event.name}" removed`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state — no saved events and not in a generation flow */}
      {localEvents.length === 0 && pageState === 'idle' && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <Calendar className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No local events yet</h3>
          <p className="text-sm text-text-muted max-w-xs">
            Select a building and date range above, then click <strong>Discover Events</strong> to find what's happening nearby.
          </p>
        </div>
      )}
    </div>
  )
}
