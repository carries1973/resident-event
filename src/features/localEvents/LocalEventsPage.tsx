import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, ExternalLink, Calendar } from 'lucide-react'
import { useLocalEventStore, useLocalEventStoreHydrated } from '@/lib/store/localEventStore'
import {
  type LocalEvent,
  type LocalEventCategory,
  LOCAL_EVENT_CATEGORY_LABELS,
  LOCAL_EVENT_COLOUR,
} from '@/lib/types/localEvent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

function formatDate(iso: string): string {
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
        <Calendar className="h-7 w-7 text-amber-500" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-1">No local events yet</h2>
      <p className="text-sm text-text-muted max-w-xs mb-6">
        Add nearby community events — farmers markets, festivals, street fairs — so they appear
        on your calendar alongside your in-building events.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Local Event
      </Button>
    </div>
  )
}

// ── Form (inline modal-style) ─────────────────────────────────────────────────

interface LocalEventFormProps {
  initial?: LocalEvent
  onSave: (data: Partial<LocalEvent> & Pick<LocalEvent, 'name' | 'date'>) => void
  onCancel: () => void
}

function LocalEventForm({ initial, onSave, onCancel }: LocalEventFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<LocalEventCategory>(initial?.category ?? 'community')
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!name.trim()) errs.push('Event name is required.')
    if (!date) errs.push('Date is required.')
    if (errs.length) { setErrors(errs); return }
    setErrors([])

    onSave({
      name: name.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim(),
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      category,
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">
        {initial ? 'Edit local event' : 'Add local event'}
      </h3>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-danger/20 p-3 mb-4">
          {errors.map((err) => (
            <p key={err} className="text-sm text-danger">{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Event name <span className="text-danger">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., "Kensington Farmers Market"'
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Date <span className="text-danger">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as LocalEventCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LOCAL_EVENT_CATEGORY_LABELS) as [LocalEventCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Start time <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              End time <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Location <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Prince's Island Park"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Link / URL <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Notes <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or notes about this event..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" size="sm">
            {initial ? 'Save changes' : 'Add event'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────

interface LocalEventCardProps {
  event: LocalEvent
  onEdit: () => void
  onDelete: () => void
}

function LocalEventCard({ event, onEdit, onDelete }: LocalEventCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 flex items-start gap-3 group',
      'bg-surface border-amber-200 dark:border-amber-800/60',
    )}>
      {/* Colour dot */}
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-text-primary text-sm">{event.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{formatDate(event.date)}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-danger hover:text-danger" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          {/* Category badge */}
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', LOCAL_EVENT_COLOUR.badge)}>
            {LOCAL_EVENT_CATEGORY_LABELS[event.category]}
          </span>

          {/* Time */}
          {event.startTime && (
            <span>
              {formatTime(event.startTime)}
              {event.endTime && ` – ${formatTime(event.endTime)}`}
            </span>
          )}

          {/* Location */}
          {event.location && (
            <span className="flex items-center gap-0.5 truncate max-w-[180px]">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          )}

          {/* Link */}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-brand hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              More info
            </a>
          )}
        </div>

        {event.description && (
          <p className="mt-1.5 text-xs text-text-muted line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function LocalEventsPage() {
  const hydrated = useLocalEventStoreHydrated()
  const localEvents = useLocalEventStore((s) => s.localEvents)
  const createLocalEvent = useLocalEventStore((s) => s.createLocalEvent)
  const updateLocalEvent = useLocalEventStore((s) => s.updateLocalEvent)
  const deleteLocalEvent = useLocalEventStore((s) => s.deleteLocalEvent)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Sort upcoming first, then past
  const sorted = [...localEvents].sort((a, b) => a.date.localeCompare(b.date))
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = sorted.filter((e) => e.date >= today)
  const past = sorted.filter((e) => e.date < today).reverse() // most recent first

  function handleSave(data: Partial<LocalEvent> & Pick<LocalEvent, 'name' | 'date'>) {
    if (editingId) {
      updateLocalEvent(editingId, data)
      toast.success(`"${data.name}" updated`)
      setEditingId(null)
    } else {
      createLocalEvent(data)
      toast.success(`"${data.name}" added to your calendar`)
      setShowForm(false)
    }
  }

  function handleDelete(event: LocalEvent) {
    if (!window.confirm(`Remove "${event.name}" from local events?`)) return
    deleteLocalEvent(event.id)
    toast.success(`"${event.name}" removed`)
  }

  if (!hydrated) {
    return (
      <div className="p-6 md:p-8">
        <div className="h-8 w-48 rounded bg-surface-hover animate-pulse mb-2" />
        <div className="h-4 w-72 rounded bg-surface-hover animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Local Events</h1>
          <p className="text-sm text-text-muted mt-1">
            Community events near your buildings. They appear on your calendar in{' '}
            <span className="font-medium text-amber-600 dark:text-amber-400">amber</span>{' '}
            alongside your in-building events.
          </p>
        </div>
        {!showForm && editingId === null && (
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Event
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <LocalEventForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {localEvents.length === 0 && !showForm && (
        <EmptyState onAdd={() => setShowForm(true)} />
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Upcoming</h2>
          {upcoming.map((event) => (
            editingId === event.id ? (
              <LocalEventForm
                key={event.id}
                initial={event}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <LocalEventCard
                key={event.id}
                event={event}
                onEdit={() => setEditingId(event.id)}
                onDelete={() => handleDelete(event)}
              />
            )
          ))}
        </section>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Past</h2>
          {past.map((event) => (
            editingId === event.id ? (
              <LocalEventForm
                key={event.id}
                initial={event}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <LocalEventCard
                key={event.id}
                event={event}
                onEdit={() => setEditingId(event.id)}
                onDelete={() => handleDelete(event)}
              />
            )
          ))}
        </section>
      )}
    </div>
  )
}
