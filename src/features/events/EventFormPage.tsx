import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEventStore, useEventStoreHydrated } from '@/lib/store/eventStore'
import { useBuildingStore, useBuildingStoreHydrated } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { createDefaultEvent, type Event } from '@/lib/types/event'
import type { RecurrenceType } from '@/lib/types/common'
import { UnsavedChangesGuard } from '@/components/common/UnsavedChangesGuard'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

/**
 * Generate recurring dates from a start date up to an end date.
 * Returns an array of YYYY-MM-DD strings (excluding the original start date).
 */
function generateRecurrenceDates(
  startDate: string,
  endDate: string,
  recurrence: 'weekly' | 'biweekly' | 'monthly',
): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return dates

  const current = new Date(start)

  // Advance once from start to get the first recurrence
  advanceDate(current, recurrence, start.getDate())

  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)

    // Safety: cap at 52 instances (one year of weekly events)
    if (dates.length >= 52) break

    advanceDate(current, recurrence, start.getDate())
  }

  return dates
}

function advanceDate(
  date: Date,
  recurrence: 'weekly' | 'biweekly' | 'monthly',
  originalDay: number,
) {
  switch (recurrence) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      break
    case 'monthly': {
      const month = date.getMonth() + 1
      date.setMonth(month)
      // Clamp to the last day of the new month if the original day overflows
      const daysInNewMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      date.setDate(Math.min(originalDay, daysInNewMonth))
      break
    }
  }
}

const CATEGORY_OPTIONS = [
  'Community', 'Wellness', 'Social', 'Seasonal', 'Food & Drink',
  'Education', 'Family', 'Cultural', 'Sustainability', 'Other',
]

export function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const hasHydrated = useEventStoreHydrated()
  const buildingsHydrated = useBuildingStoreHydrated()
  const existingEvent = useEventStore((s) =>
    id ? s.events.find((e) => e.id === id) : undefined,
  )
  const allEvents = useEventStore((s) => s.events)
  const createEvent = useEventStore((s) => s.createEvent)
  const updateEvent = useEventStore((s) => s.updateEvent)
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)

  const [form, setForm] = useState<Event>(() =>
    existingEvent
      ? { ...existingEvent }
      : createDefaultEvent({
          name: '',
          buildingId: '',  // resolved after hydration via useEffect below
        }),
  )
  const [isDirty, setIsDirty] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Recurring edit propagation dialog
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<Event | null>(null)

  // Resolve buildingId once stores have finished rehydrating from localStorage.
  // Without this, currentBuildingId and buildings are empty on fresh page load.
  useEffect(() => {
    if (!buildingsHydrated) return
    if (isEditing) return  // editing mode: form already pre-filled from existingEvent
    if (form.buildingId) return  // user already selected something
    const resolved = currentBuildingId ?? buildings[0]?.id ?? ''
    if (resolved) {
      setForm((prev) => ({ ...prev, buildingId: resolved }))
    }
  }, [buildingsHydrated, isEditing, form.buildingId, currentBuildingId, buildings])

  useEffect(() => {
    if (existingEvent) {
      setForm({ ...existingEvent })
      setIsDirty(false)
    }
  }, [existingEvent])

  useEffect(() => {
    if (hasHydrated && id && !existingEvent) {
      navigate('/events', { replace: true })
    }
  }, [hasHydrated, id, existingEvent, navigate])

  // Wait for store to hydrate before rendering (prevents flash on page refresh)
  if (id && !hasHydrated) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">Loading&hellip;</p>
      </div>
    )
  }

  // Show not-found message while redirecting
  if (id && hasHydrated && !existingEvent) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">Event not found. Redirecting&hellip;</p>
      </div>
    )
  }

  function updateField<K extends keyof Event>(key: K, value: Event[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  function addTag() {
    const val = tagInput.trim()
    if (!val || form.tags.includes(val)) return
    updateField('tags', [...form.tags, val])
    setTagInput('')
  }

  /**
   * Check if this event is part of a recurring series (either parent or child).
   * Returns the parent event ID if it is, null otherwise.
   */
  function getRecurrenceParentId(): string | null {
    if (!existingEvent) return null
    if (existingEvent.recurrenceParentId) return existingEvent.recurrenceParentId
    // Check if this event is a parent (has children pointing to it)
    const hasChildren = allEvents.some((e) => e.recurrenceParentId === existingEvent.id)
    if (hasChildren) return existingEvent.id
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!form.name.trim()) errs.push('Event name is required.')
    if (!form.buildingId) errs.push('Building is required.')

    // Validate recurrence fields
    if (form.recurrence !== 'none') {
      if (!form.date) errs.push('Start date is required for recurring events.')
      if (!form.recurrenceEndDate) errs.push('End date is required for recurring events.')
      if (form.date && form.recurrenceEndDate && form.recurrenceEndDate <= form.date) {
        errs.push('Recurrence end date must be after the event date.')
      }
    }

    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])

    if (isEditing && id) {
      // Check if this is part of a recurring series — if so, ask the user
      const parentId = getRecurrenceParentId()
      if (parentId) {
        setPendingFormData({ ...form })
        setShowRecurringDialog(true)
        return
      }

      // Non-recurring edit — save immediately
      updateEvent(id, { ...form, updatedAt: new Date().toISOString() })
      toast.success(`"${form.name}" updated`)
      setIsDirty(false)
      navigate(`/events/${id}`)
    } else {
      // Create the parent event
      const parentEvent = createEvent({
        ...form,
        name: form.name.trim(),
      })

      // Generate recurring instances if applicable
      if (
        form.recurrence !== 'none' &&
        form.date &&
        form.recurrenceEndDate
      ) {
        const futureDates = generateRecurrenceDates(
          form.date,
          form.recurrenceEndDate,
          form.recurrence as 'weekly' | 'biweekly' | 'monthly',
        )

        for (const date of futureDates) {
          createEvent({
            ...form,
            name: form.name.trim(),
            date,
            recurrenceParentId: parentEvent.id,
            // Reset instance-specific fields
            rsvpCount: 0,
            rsvpList: [],
            rsvpWaitlist: [],
            closeout: undefined,
            marketing: undefined,
            dayOfChecklist: form.dayOfChecklist.map((item) => ({
              ...item,
              id: crypto.randomUUID(),
              completed: false,
            })),
          })
        }

        const total = futureDates.length + 1
        toast.success(`"${parentEvent.name}" created with ${total} occurrences`)
      } else {
        toast.success(`"${parentEvent.name}" created`)
      }

      setIsDirty(false)
      navigate(`/events/${parentEvent.id}`)
    }
  }

  /** Save changes to this event only */
  function handleSaveThisOnly() {
    if (!id || !pendingFormData) return
    updateEvent(id, { ...pendingFormData, updatedAt: new Date().toISOString() })
    toast.success(`"${pendingFormData.name}" updated`)
    setShowRecurringDialog(false)
    setIsDirty(false)
    navigate(`/events/${id}`)
  }

  /** Save changes to this event AND all future events in the series */
  function handleSaveAllFuture() {
    if (!id || !pendingFormData) return

    const now = new Date().toISOString()
    const parentId = getRecurrenceParentId()

    // Determine which events are "future" siblings (same parent, date >= today)
    const today = new Date().toISOString().slice(0, 10)
    const siblings = allEvents.filter((e) => {
      if (e.id === id) return false // handled separately below
      const eParentId = e.recurrenceParentId ?? (e.id === parentId ? e.id : null)
      if (!eParentId || eParentId !== parentId) return false
      return e.date >= today
    })

    // Update the current event
    updateEvent(id, { ...pendingFormData, updatedAt: now })

    // Update all future siblings — preserve their individual dates and instance-specific data
    for (const sibling of siblings) {
      updateEvent(sibling.id, {
        name: pendingFormData.name,
        description: pendingFormData.description,
        whyItWorks: pendingFormData.whyItWorks,
        category: pendingFormData.category,
        startTime: pendingFormData.startTime,
        endTime: pendingFormData.endTime,
        location: pendingFormData.location,
        budgetEstimate: pendingFormData.budgetEstimate,
        setupAndSupplies: pendingFormData.setupAndSupplies,
        staffing: pendingFormData.staffing,
        weatherPlan: pendingFormData.weatherPlan,
        accessibilityNotes: pendingFormData.accessibilityNotes,
        measurementPlan: pendingFormData.measurementPlan,
        rsvpEnabled: pendingFormData.rsvpEnabled,
        rsvpLimit: pendingFormData.rsvpLimit,
        tags: pendingFormData.tags,
        updatedAt: now,
      })
    }

    const updatedCount = siblings.length + 1
    toast.success(`Updated ${updatedCount} event${updatedCount !== 1 ? 's' : ''} in this series`)
    setShowRecurringDialog(false)
    setIsDirty(false)
    navigate(`/events/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <UnsavedChangesGuard hasUnsavedChanges={isDirty} />

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {isEditing ? `Edit ${existingEvent?.name ?? 'Event'}` : 'New event'}
      </h1>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-danger/20 p-3 mb-6">
          {errors.map((err) => (
            <p key={err} className="text-sm text-danger">{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Event details
          </h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Event name <span className="text-danger">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder='e.g., "Summer BBQ Social"'
              autoFocus={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Building <span className="text-danger">*</span>
            </label>
            <Select value={form.buildingId} onValueChange={(v) => updateField('buildingId', v)}>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Start time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">End time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
            <Input
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g., Rooftop Patio"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Recurrence</label>
              <Select
                value={form.recurrence}
                onValueChange={(v) => {
                  updateField('recurrence', v as RecurrenceType)
                  if (v === 'none') updateField('recurrenceEndDate', undefined)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.recurrence !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Recurrence end date
              </label>
              <Input
                type="date"
                value={form.recurrenceEndDate ?? ''}
                onChange={(e) => updateField('recurrenceEndDate', e.target.value || undefined)}
                min={form.date || undefined}
              />
              <p className="text-xs text-text-muted mt-1">
                Individual events will be created for each occurrence up to this date.
              </p>
            </div>
          )}
        </section>

        {/* Content */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Content
          </h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description <span className="text-text-muted font-normal">(resident-facing)</span>
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="What residents will see about this event..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Why it works <span className="text-text-muted font-normal">(internal notes)</span>
            </label>
            <Textarea
              value={form.whyItWorks}
              onChange={(e) => updateField('whyItWorks', e.target.value)}
              placeholder="Internal rationale for this event..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag() }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-page px-2 py-0.5 text-xs text-text-secondary cursor-pointer hover:bg-danger/10 hover:text-danger"
                    onClick={() => updateField('tags', form.tags.filter((t) => t !== tag))}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Budget */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Budget
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Budget tier</label>
              <Select
                value={form.budgetEstimate?.tier ?? 'moderate'}
                onValueChange={(v) =>
                  updateField('budgetEstimate', {
                    ...form.budgetEstimate,
                    tier: v as 'low' | 'moderate' | 'premium',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Estimated cost <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <Input
                type="number"
                min={0}
                value={form.budgetEstimate?.amount ?? ''}
                onChange={(e) =>
                  updateField('budgetEstimate', {
                    ...form.budgetEstimate,
                    tier: form.budgetEstimate?.tier ?? 'moderate',
                    amount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 250"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Budget breakdown <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Input
              value={form.budgetEstimate?.breakdown ?? ''}
              onChange={(e) =>
                updateField('budgetEstimate', {
                  ...form.budgetEstimate,
                  tier: form.budgetEstimate?.tier ?? 'moderate',
                  breakdown: e.target.value || undefined,
                })
              }
              placeholder="e.g., $100 food, $50 decorations, $100 entertainment"
            />
          </div>
        </section>

        {/* Logistics */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Logistics
          </h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Setup & supplies</label>
            <Textarea
              value={form.setupAndSupplies}
              onChange={(e) => updateField('setupAndSupplies', e.target.value)}
              placeholder="What needs to be set up, what supplies are needed..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Staffing</label>
            <Input
              value={form.staffing}
              onChange={(e) => updateField('staffing', e.target.value)}
              placeholder="e.g., 2 staff for setup, 1 during event"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Weather plan</label>
            <Input
              value={form.weatherPlan}
              onChange={(e) => updateField('weatherPlan', e.target.value)}
              placeholder="Indoor backup or weather notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Accessibility notes</label>
            <Input
              value={form.accessibilityNotes}
              onChange={(e) => updateField('accessibilityNotes', e.target.value)}
              placeholder="Wheelchair access, hearing considerations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Measurement plan <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <Textarea
              value={form.measurementPlan}
              onChange={(e) => updateField('measurementPlan', e.target.value)}
              placeholder="How will you measure success? e.g., attendance count, resident feedback survey..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rsvpEnabled}
                  onChange={(e) => updateField('rsvpEnabled', e.target.checked)}
                  className="h-4 w-4 rounded border-border-default text-brand focus:ring-brand"
                />
                Enable RSVP
              </label>
            </div>
            {form.rsvpEnabled && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  RSVP limit <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.rsvpLimit ?? ''}
                  onChange={(e) =>
                    updateField('rsvpLimit', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="No limit"
                />
              </div>
            )}
          </div>
        </section>

        {/* Actions — sticky on mobile, inline on desktop */}
        <div className="hidden sm:flex items-center gap-3 pt-4 border-t border-border-default">
          <Button type="submit" size="lg">
            {isEditing ? 'Save changes' : 'Create event'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>

        {/* Sticky footer — mobile only */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-border-default p-3 flex gap-2 safe-area-bottom">
          <Button type="submit" size="lg" className="flex-1">
            {isEditing ? 'Save changes' : 'Create event'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
        {/* Spacer so content doesn't hide behind sticky footer on mobile */}
        <div className="sm:hidden h-20" />
      </form>

      {/* Recurring event edit propagation dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-brand" />
              Edit recurring event
            </DialogTitle>
            <DialogDescription>
              This event is part of a recurring series. How would you like to apply your changes?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <button
              type="button"
              onClick={handleSaveThisOnly}
              className="w-full text-left rounded-lg border border-border-default p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-medium text-text-primary text-sm">This event only</p>
              <p className="text-xs text-text-muted mt-0.5">
                Only update this single occurrence. Other events in the series remain unchanged.
              </p>
            </button>
            <button
              type="button"
              onClick={handleSaveAllFuture}
              className="w-full text-left rounded-lg border border-border-default p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-medium text-text-primary text-sm">This and all future events</p>
              <p className="text-xs text-text-muted mt-0.5">
                Update this occurrence and all future events in the series. Past events and individual RSVP/closeout data are preserved.
              </p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecurringDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
