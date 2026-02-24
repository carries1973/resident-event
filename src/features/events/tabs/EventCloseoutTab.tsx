import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import type { Event, EventCloseout } from '@/lib/types/event'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import {
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardCheck,
  CalendarClock,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Post-event follow-up checklist items
// ---------------------------------------------------------------------------

interface FollowUpItem {
  id: string
  label: string
  detail?: string
}

const FOLLOWUP_ITEMS: FollowUpItem[] = [
  { id: 'send_thankyou', label: 'Send thank-you email to attendees', detail: 'Within 24 hours' },
  { id: 'collect_feedback', label: 'Collect feedback survey responses' },
  { id: 'upload_photos', label: 'Upload event photos / videos' },
  { id: 'social_recap', label: 'Post social media recap' },
  { id: 'record_costs', label: 'Enter actual costs into budget tracker' },
  { id: 'document_learnings', label: 'Document lessons learned for next time' },
  { id: 'notify_waitlist', label: 'Notify waitlisted residents of next event' },
  { id: 'archive_materials', label: 'Archive event materials (flyers, signage, etc.)' },
  { id: 'assign_next', label: 'Assign next event planner / owner' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function attendanceDelta(actual: number, expected: number): string {
  if (expected === 0) return ''
  const pct = Math.round(((actual - expected) / expected) * 100)
  if (pct > 0) return `+${pct}%`
  if (pct < 0) return `${pct}%`
  return '0%'
}

function budgetDelta(actual: number, budgeted: number): string {
  if (budgeted === 0) return ''
  const diff = actual - budgeted
  if (diff > 0) return `$${diff.toFixed(2)} over budget`
  if (diff < 0) return `$${Math.abs(diff).toFixed(2)} under budget`
  return 'On budget'
}

interface EventCloseoutTabProps {
  event: Event
}

export function EventCloseoutTab({ event }: EventCloseoutTabProps) {
  const navigate = useNavigate()
  const completeCloseout = useEventStore((s) => s.completeCloseout)
  const skipCloseout = useEventStore((s) => s.skipCloseout)
  const status = computeEventStatus(event)

  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [followUp, setFollowUp] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState<Partial<EventCloseout>>({
    actualAttendance: event.closeout?.actualAttendance ?? event.rsvpCount,
    expectedAttendance: event.closeout?.expectedAttendance ?? (event.rsvpLimit ?? event.rsvpCount),
    actualCost: event.closeout?.actualCost ?? 0,
    budgetedCost: event.closeout?.budgetedCost ?? (event.budgetEstimate?.amount ?? 0),
    feedbackSummary: event.closeout?.feedbackSummary ?? '',
    lessonsLearned: event.closeout?.lessonsLearned ?? '',
    photosShared: event.closeout?.photosShared ?? false,
    thankYousSent: event.closeout?.thankYousSent ?? false,
  })

  function toggleFollowUp(id: string) {
    setFollowUp((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Already completed with closeout data ──
  if (event.closeout) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-success/20 p-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-success flex-shrink-0" />
          <p className="text-sm font-medium text-success">Closeout completed</p>
        </div>
        <CloseoutSummary closeout={event.closeout} />
      </div>
    )
  }

  // ── Completed without closeout data (skipped) ──
  if (status === 'completed') {
    return (
      <div className="text-center py-10">
        <div className="rounded-lg bg-surface border border-border-default p-6 inline-block text-left max-w-sm">
          <p className="text-sm font-medium text-text-primary mb-1">Closeout skipped</p>
          <p className="text-sm text-text-muted">No post-event data was recorded for this event.</p>
        </div>
      </div>
    )
  }

  // ── Not ready yet — show informative preview ──
  if (status !== 'needs_closeout') {
    // Format event date + time for display
    const eventDateDisplay = event.date
      ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-CA', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })
      : null
    const timeDisplay = event.startTime && event.endTime
      ? `${event.startTime} – ${event.endTime}`
      : event.startTime ?? null
    const estimatedAttendance = event.rsvpLimit ?? event.rsvpCount ?? null

    return (
      <div className="space-y-6 max-w-lg">
        {/* Status banner */}
        <div className="flex items-start gap-3 rounded-lg border border-border-default bg-surface p-4">
          <CalendarClock className="h-5 w-5 text-text-muted shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">Event not yet completed</p>
            {eventDateDisplay ? (
              <p className="text-sm text-text-secondary">
                Scheduled for <span className="font-medium">{eventDateDisplay}</span>
                {timeDisplay && <> at <span className="font-medium">{timeDisplay}</span></>}.
              </p>
            ) : (
              <p className="text-sm text-text-secondary">No date set yet.</p>
            )}
            <p className="text-sm text-text-muted">Closeout will be available after the event ends.</p>
          </div>
        </div>

        {/* What you'll be able to do */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            When complete, you'll be able to:
          </p>
          <ul className="space-y-2">
            {[
              estimatedAttendance
                ? `Record actual attendance (estimated: ${estimatedAttendance})`
                : 'Record actual attendance vs. expected',
              'Send thank-you email to attendees',
              'Collect and summarise resident feedback',
              event.budgetEstimate?.amount
                ? `Reconcile budget (estimated: $${event.budgetEstimate.amount})`
                : 'Reconcile budget (actual vs. estimated costs)',
              'Upload event photos to the library',
              'Document lessons learned for future events',
              'Archive event materials',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-success font-bold mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation CTAs */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${event.id}/edit`)}
          >
            Edit Event
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              // Switch to Day-Of tab by dispatching a click on the tab trigger
              const dayOfTab = document.querySelector('[data-value="dayof"]') as HTMLElement
              dayOfTab?.click()
            }}
          >
            Go to Day-Of
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  const actualAtt = form.actualAttendance ?? 0
  const expectedAtt = form.expectedAttendance ?? 0
  const actualCost = form.actualCost ?? 0
  const budgetedCost = form.budgetedCost ?? 0
  const attDelta = attendanceDelta(actualAtt, expectedAtt)
  const costDelta = budgetDelta(actualCost, budgetedCost)
  const followUpDone = Object.values(followUp).filter(Boolean).length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const closeout: EventCloseout = {
      actualAttendance: form.actualAttendance ?? 0,
      expectedAttendance: form.expectedAttendance ?? 0,
      actualCost: form.actualCost ?? 0,
      budgetedCost: form.budgetedCost ?? 0,
      feedbackSummary: form.feedbackSummary ?? '',
      lessonsLearned: form.lessonsLearned ?? '',
      photosShared: form.photosShared ?? false,
      thankYousSent: form.thankYousSent ?? false,
      completedAt: new Date().toISOString(),
    }
    completeCloseout(event.id, closeout)
    toast.success('Closeout completed! Great work.')
  }

  return (
    <div className="space-y-8">
      {/* Needs-closeout banner */}
      <div className="rounded-lg border border-warning/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
        <p className="font-medium text-warning">This event needs a closeout.</p>
        <p className="text-text-muted mt-0.5">Fill in the details below to complete your records.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Attendance */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-default pb-2">Attendance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Expected</label>
              <Input type="number" min={0} value={form.expectedAttendance ?? ''} onChange={(e) => setForm((f) => ({ ...f, expectedAttendance: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Actual</label>
              <Input type="number" min={0} value={form.actualAttendance ?? ''} onChange={(e) => setForm((f) => ({ ...f, actualAttendance: Number(e.target.value) }))} />
            </div>
          </div>
          {attDelta && expectedAtt > 0 && (
            <div className={cn('flex items-center gap-1.5 text-sm font-medium', actualAtt >= expectedAtt ? 'text-success' : 'text-warning')}>
              {actualAtt > expectedAtt ? <TrendingUp className="h-4 w-4" /> : actualAtt < expectedAtt ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {attDelta} vs expected
            </div>
          )}
        </section>

        {/* Budget */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-default pb-2">Budget Reconciliation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Budgeted ($)</label>
              <Input type="number" min={0} step={0.01} value={form.budgetedCost ?? ''} onChange={(e) => setForm((f) => ({ ...f, budgetedCost: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Actual Spend ($)</label>
              <Input type="number" min={0} step={0.01} value={form.actualCost ?? ''} onChange={(e) => setForm((f) => ({ ...f, actualCost: Number(e.target.value) }))} />
            </div>
          </div>
          {budgetedCost > 0 && (
            <div className={cn('flex items-center gap-1.5 text-sm font-medium', actualCost <= budgetedCost ? 'text-success' : 'text-danger')}>
              {actualCost > budgetedCost ? <TrendingUp className="h-4 w-4" /> : actualCost < budgetedCost ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {costDelta}
            </div>
          )}
        </section>

        {/* Feedback */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-default pb-2">Feedback &amp; Learnings</h3>
          <div className="space-y-1">
            <label className="block text-xs text-text-muted font-medium">Resident feedback summary</label>
            <Textarea value={form.feedbackSummary} onChange={(e) => setForm((f) => ({ ...f, feedbackSummary: e.target.value }))} placeholder="Overall feedback from residents..." rows={2} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-text-muted font-medium">Lessons learned</label>
            <Textarea value={form.lessonsLearned} onChange={(e) => setForm((f) => ({ ...f, lessonsLearned: e.target.value }))} placeholder="What would you do differently next time?" rows={2} />
          </div>
        </section>

        {/* Post-Event Follow-Up Checklist */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border-default pb-2">
            <h3 className="text-sm font-semibold text-text-primary">Post-Event Follow-Up</h3>
            <span className="text-xs text-text-muted">{followUpDone}/{FOLLOWUP_ITEMS.length} done</span>
          </div>
          <ul className="space-y-1">
            {FOLLOWUP_ITEMS.map((item) => {
              const checked = !!(followUp[item.id])
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleFollowUp(item.id)
                      if (item.id === 'upload_photos') setForm((f) => ({ ...f, photosShared: !checked }))
                      if (item.id === 'send_thankyou') setForm((f) => ({ ...f, thankYousSent: !checked }))
                    }}
                    className={cn('flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors min-h-[44px] hover:bg-surface-hover', checked && 'opacity-60')}
                  >
                    {checked
                      ? <CheckSquare className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      : <Square className="h-5 w-5 text-text-muted flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-sm block', checked ? 'line-through text-text-muted' : 'text-text-primary')}>{item.label}</span>
                      {item.detail && <span className="text-xs text-text-muted">{item.detail}</span>}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border-default">
          <Button type="submit">Complete Closeout</Button>
          <Button type="button" variant="outline" onClick={() => setShowSkipConfirm(true)}>Skip Closeout</Button>
        </div>
      </form>

      <ConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        title="Skip closeout?"
        description="Skipping means no data will be recorded for this event. Continue?"
        confirmLabel="Skip closeout"
        variant="destructive"
        onConfirm={() => { skipCloseout(event.id); toast.success('Closeout skipped') }}
      />
    </div>
  )
}

function CloseoutSummary({ closeout }: { closeout: EventCloseout }) {
  const attDelta = attendanceDelta(closeout.actualAttendance, closeout.expectedAttendance)
  const costDelta = budgetDelta(closeout.actualCost, closeout.budgetedCost)
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border-default p-3">
          <p className="text-xs text-text-muted font-medium">Attendance</p>
          <p className="text-text-primary font-semibold text-base mt-0.5">
            {closeout.actualAttendance}
            <span className="text-text-muted font-normal text-sm"> / {closeout.expectedAttendance} expected</span>
          </p>
          {attDelta && <p className={cn('text-xs font-medium mt-0.5', closeout.actualAttendance >= closeout.expectedAttendance ? 'text-success' : 'text-warning')}>{attDelta}</p>}
        </div>
        <div className="rounded-lg border border-border-default p-3">
          <p className="text-xs text-text-muted font-medium">Spend</p>
          <p className="text-text-primary font-semibold text-base mt-0.5">
            ${closeout.actualCost.toFixed(2)}
            <span className="text-text-muted font-normal text-sm"> / ${closeout.budgetedCost.toFixed(2)} budgeted</span>
          </p>
          {costDelta && <p className={cn('text-xs font-medium mt-0.5', closeout.actualCost <= closeout.budgetedCost ? 'text-success' : 'text-danger')}>{costDelta}</p>}
        </div>
      </div>
      {closeout.feedbackSummary && <div><p className="text-xs text-text-muted font-medium mb-1">Feedback</p><p className="text-text-secondary">{closeout.feedbackSummary}</p></div>}
      {closeout.lessonsLearned && <div><p className="text-xs text-text-muted font-medium mb-1">Lessons learned</p><p className="text-text-secondary">{closeout.lessonsLearned}</p></div>}
      <div className="flex gap-4 pt-1">
        <span className={cn('text-xs', closeout.photosShared ? 'text-success' : 'text-text-muted')}>{closeout.photosShared ? '✓' : '○'} Photos shared</span>
        <span className={cn('text-xs', closeout.thankYousSent ? 'text-success' : 'text-text-muted')}>{closeout.thankYousSent ? '✓' : '○'} Thank-yous sent</span>
      </div>
    </div>
  )
}
