import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import type { Event, EventCloseout } from '@/lib/types/event'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'

interface EventCloseoutTabProps {
  event: Event
}

export function EventCloseoutTab({ event }: EventCloseoutTabProps) {
  const completeCloseout = useEventStore((s) => s.completeCloseout)
  const skipCloseout = useEventStore((s) => s.skipCloseout)
  const status = computeEventStatus(event)

  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [form, setForm] = useState<Partial<EventCloseout>>({
    actualAttendance: event.closeout?.actualAttendance ?? event.rsvpCount,
    expectedAttendance: event.closeout?.expectedAttendance ?? event.rsvpCount,
    actualCost: event.closeout?.actualCost ?? 0,
    budgetedCost: event.closeout?.budgetedCost ?? event.budgetEstimate.amount ?? 0,
    feedbackSummary: event.closeout?.feedbackSummary ?? '',
    lessonsLearned: event.closeout?.lessonsLearned ?? '',
    photosShared: event.closeout?.photosShared ?? false,
    thankYousSent: event.closeout?.thankYousSent ?? false,
  })

  // Already completed with closeout data
  if (event.closeout) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-success/20 p-4">
          <p className="text-sm font-medium text-success">Closeout completed</p>
        </div>
        <CloseoutSummary closeout={event.closeout} />
      </div>
    )
  }

  // Completed without closeout data (i.e., closeout was skipped)
  if (status === 'completed') {
    return (
      <div className="text-center py-8">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-border-default p-4 inline-block">
          <p className="text-sm text-text-muted">
            Closeout was skipped for this event. No post-event data was recorded.
          </p>
        </div>
      </div>
    )
  }

  // Not ready for closeout yet (event hasn't happened)
  if (status !== 'needs_closeout') {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">
          Closeout will be available once this event has ended.
        </p>
      </div>
    )
  }

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
    toast.success('Closeout completed!')
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Attendance */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Attendance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Expected</label>
              <Input
                type="number"
                min={0}
                value={form.expectedAttendance ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, expectedAttendance: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Actual</label>
              <Input
                type="number"
                min={0}
                value={form.actualAttendance ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, actualAttendance: Number(e.target.value) }))}
              />
            </div>
          </div>
        </section>

        {/* Budget */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Budget</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Budgeted ($)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.budgetedCost ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, budgetedCost: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Actual ($)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.actualCost ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, actualCost: Number(e.target.value) }))}
              />
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Feedback</h3>
          <Textarea
            value={form.feedbackSummary}
            onChange={(e) => setForm((f) => ({ ...f, feedbackSummary: e.target.value }))}
            placeholder="Overall feedback summary..."
            rows={2}
          />
          <Textarea
            value={form.lessonsLearned}
            onChange={(e) => setForm((f) => ({ ...f, lessonsLearned: e.target.value }))}
            placeholder="Lessons learned for next time..."
            rows={2}
          />
        </section>

        {/* Content sharing */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Follow-up</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.photosShared}
              onChange={(e) => setForm((f) => ({ ...f, photosShared: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Photos/videos shared
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.thankYousSent}
              onChange={(e) => setForm((f) => ({ ...f, thankYousSent: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Thank-you notes sent
          </label>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit">Complete closeout</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSkipConfirm(true)}
          >
            Skip closeout
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        title="Skip closeout?"
        description="Skipping closeout means no data will be recorded for this event. You can't undo this. Continue?"
        confirmLabel="Skip closeout"
        variant="destructive"
        onConfirm={() => {
          skipCloseout(event.id)
          toast.success('Closeout skipped')
        }}
      />
    </div>
  )
}

function CloseoutSummary({ closeout }: { closeout: EventCloseout }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-text-muted">Attendance:</span>{' '}
        {closeout.actualAttendance} / {closeout.expectedAttendance} expected
      </div>
      <div>
        <span className="text-text-muted">Cost:</span>{' '}
        ${closeout.actualCost.toFixed(2)} / ${closeout.budgetedCost.toFixed(2)} budgeted
      </div>
      {closeout.feedbackSummary && (
        <div className="col-span-2">
          <span className="text-text-muted">Feedback:</span>{' '}
          {closeout.feedbackSummary}
        </div>
      )}
      {closeout.lessonsLearned && (
        <div className="col-span-2">
          <span className="text-text-muted">Lessons:</span>{' '}
          {closeout.lessonsLearned}
        </div>
      )}
    </div>
  )
}
