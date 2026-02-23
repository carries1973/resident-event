import { useState, useRef, useEffect, useMemo } from 'react'
import { useEventStore } from '@/lib/store/eventStore'
import type { Event } from '@/lib/types/event'
import type { ChecklistItem, StaffRole } from '@/lib/types/common'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, User, Clock } from 'lucide-react'

type Phase = 'setup' | 'during' | 'teardown'

const PHASE_LABELS: Record<Phase, string> = {
  setup: 'Setup',
  during: 'During Event',
  teardown: 'Teardown',
}

function getActivePhase(event: Event): Phase {
  if (!event.date || !event.startTime || !event.endTime) {
    return 'setup'
  }

  const now = new Date()
  const [startH, startM] = event.startTime.split(':').map(Number)
  const [endH, endM] = event.endTime.split(':').map(Number)

  const eventDate = new Date(event.date + 'T00:00:00')
  const start = new Date(eventDate)
  start.setHours(startH, startM, 0, 0)
  const end = new Date(eventDate)
  end.setHours(endH, endM, 0, 0)

  // If it's not even the event date, default to setup
  if (now.toDateString() !== eventDate.toDateString()) {
    return 'setup'
  }

  if (now < start) return 'setup'
  if (now >= start && now <= end) return 'during'
  return 'teardown'
}

const PHASE_BADGE_STYLES: Record<Phase, string> = {
  setup: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  during: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  teardown: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

interface EventDayOfTabProps {
  event: Event
}

export function EventDayOfTab({ event }: EventDayOfTabProps) {
  const updateEvent = useEventStore((s) => s.updateEvent)
  const checklist = event.dayOfChecklist
  const staffRoles = event.staffRoles

  // Recompute active phase every minute
  const [activePhase, setActivePhase] = useState<Phase>(() => getActivePhase(event))

  useEffect(() => {
    setActivePhase(getActivePhase(event))
    const interval = setInterval(() => {
      setActivePhase(getActivePhase(event))
    }, 60_000)
    return () => clearInterval(interval)
  }, [event.date, event.startTime, event.endTime])

  const completed = checklist.filter((item) => item.completed).length
  const total = checklist.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  // Group by category
  const grouped = useMemo(() => ({
    setup: checklist.filter((i) => i.category === 'setup'),
    during: checklist.filter((i) => i.category === 'during'),
    teardown: checklist.filter((i) => i.category === 'teardown'),
  }), [checklist])

  function toggleItem(itemId: string) {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    )
    updateEvent(event.id, { dayOfChecklist: updated })
  }

  function addItem(text: string, category: Phase) {
    const trimmed = text.trim()
    if (!trimmed) return
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      category,
    }
    updateEvent(event.id, { dayOfChecklist: [...checklist, newItem] })
  }

  if (total === 0 && staffRoles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted mb-2">No checklist items yet.</p>
        <p className="text-sm text-text-muted">
          Checklist items will be auto-populated when you use the AI planner, or you can add them manually below.
        </p>
        <div className="mt-6 space-y-4">
          {(['setup', 'during', 'teardown'] as const).map((phase) => (
            <div key={phase}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {PHASE_LABELS[phase]}
              </h3>
              <InlineAddItem category={phase} onAdd={addItem} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Phase Indicator */}
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-text-muted flex-shrink-0" />
        <Badge
          className={cn(
            'text-sm font-semibold px-3 py-1',
            PHASE_BADGE_STYLES[activePhase],
          )}
        >
          Currently: {PHASE_LABELS[activePhase].toUpperCase()}
        </Badge>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-primary font-medium">{completed}/{total} items complete</span>
          <span className="text-text-muted">{percentage}%</span>
        </div>
        <Progress value={percentage} />
      </div>

      {/* Grouped Checklist */}
      {(['setup', 'during', 'teardown'] as const).map((phase) => {
        const items = grouped[phase]
        const phaseCompleted = items.filter((i) => i.completed).length
        const phaseTotal = items.length
        const isActive = phase === activePhase

        return (
          <div
            key={phase}
            className={cn(
              'rounded-lg border p-4 transition-colors',
              isActive
                ? 'border-accent-primary/30 bg-accent-primary/5'
                : 'border-border-default',
            )}
          >
            {/* Phase Header with mini progress */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {PHASE_LABELS[phase]}
                {phaseTotal > 0 && (
                  <span className="ml-2 text-text-secondary font-normal normal-case">
                    ({phaseCompleted}/{phaseTotal})
                  </span>
                )}
              </h3>
              {isActive && (
                <span className="text-[11px] font-medium text-accent-primary uppercase tracking-wide">
                  Active
                </span>
              )}
            </div>

            {/* Items */}
            {phaseTotal > 0 && (
              <ul className="space-y-1 mb-3">
                {items.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </ul>
            )}

            {/* Inline Add Item */}
            <InlineAddItem category={phase} onAdd={addItem} />
          </div>
        )
      })}

      {/* Staff Roles Section */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Staff Roles
        </h3>
        {staffRoles.length === 0 ? (
          <p className="text-sm text-text-muted italic">
            No staff roles assigned.
          </p>
        ) : (
          <ul className="space-y-3">
            {staffRoles.map((role) => (
              <StaffRoleRow key={role.id} role={role} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ─── Checklist Row ───────────────────────────────────────────────── */

function ChecklistRow({
  item,
  onToggle,
}: {
  item: ChecklistItem
  onToggle: () => void
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors min-h-[44px]',
          'hover:bg-surface-hover',
          item.completed && 'opacity-60',
        )}
      >
        {/* Larger checkbox for mobile */}
        <div
          className={cn(
            'h-6 w-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-0.5',
            item.completed
              ? 'bg-success border-success text-white'
              : 'border-border-default',
          )}
        >
          {item.completed && (
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>

        {/* Text + assigned-to stacked on mobile */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'text-sm block break-words',
              item.completed ? 'line-through text-text-muted' : 'text-text-primary',
            )}
          >
            {item.text}
          </span>
          {item.assignedTo && (
            <span className="text-xs text-text-muted block mt-0.5">
              Assigned to: {item.assignedTo}
            </span>
          )}
        </div>
      </button>
    </li>
  )
}

/* ─── Inline Add Item ─────────────────────────────────────────────── */

function InlineAddItem({
  category,
  onAdd,
}: {
  category: Phase
  onAdd: (text: string, category: Phase) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  function handleSubmit() {
    const trimmed = text.trim()
    if (trimmed) {
      onAdd(trimmed, category)
    }
    setText('')
    setIsAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setText('')
      setIsAdding(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-accent-primary transition-colors py-1.5 px-1 min-h-[44px]"
      >
        <Plus className="h-4 w-4" />
        <span>Add item</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <Plus className="h-4 w-4 text-text-muted flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={`Add ${PHASE_LABELS[category].toLowerCase()} item...`}
        className="flex-1 text-sm bg-transparent border-b border-border-default focus:border-accent-primary outline-none py-1.5 text-text-primary placeholder:text-text-muted min-h-[44px]"
      />
    </div>
  )
}

/* ─── Staff Role Row ──────────────────────────────────────────────── */

function StaffRoleRow({ role }: { role: StaffRole }) {
  return (
    <li className="rounded-md border border-border-default px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="h-4 w-4 text-accent-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{role.role}</p>
          <p className="text-sm text-text-secondary mt-0.5">{role.assignedTo}</p>
          {role.responsibilities && (
            <p className="text-xs text-text-muted mt-1 break-words">{role.responsibilities}</p>
          )}
        </div>
      </div>
    </li>
  )
}
