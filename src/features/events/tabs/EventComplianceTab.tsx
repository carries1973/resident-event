import { useState } from 'react'
import { useEventStore } from '@/lib/store/eventStore'
import type { Event } from '@/lib/types/event'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ShieldCheck, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Compliance Log — tracks regulatory and safety items per event
// ---------------------------------------------------------------------------

export interface ComplianceEntry {
  id: string
  category: 'safety' | 'noise' | 'capacity' | 'accessibility' | 'permit' | 'other'
  status: 'ok' | 'flagged' | 'na'
  note: string
  createdAt: string
}

const CATEGORY_LABELS: Record<ComplianceEntry['category'], string> = {
  safety:        '🔥 Safety & Fire Code',
  noise:         '🔊 Noise Restrictions',
  capacity:      '👥 Occupancy Limit',
  accessibility: '♿ Accessibility',
  permit:        '📋 Permit / Insurance',
  other:         '📝 Other',
}

const STATUS_STYLES: Record<ComplianceEntry['status'], string> = {
  ok:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  na:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_LABELS: Record<ComplianceEntry['status'], string> = {
  ok:      '✓ OK',
  flagged: '⚠ Flagged',
  na:      '— N/A',
}

// Store compliance entries in event's accessibilityNotes field as JSON
// (lightweight — avoids a schema change)
const KEY = '__compliance__'

function loadEntries(event: Event): ComplianceEntry[] {
  try {
    const raw = event.accessibilityNotes ?? ''
    if (!raw.startsWith(KEY)) return []
    return JSON.parse(raw.slice(KEY.length))
  } catch {
    return []
  }
}

function encodeEntries(entries: ComplianceEntry[]): string {
  return KEY + JSON.stringify(entries)
}

interface EventComplianceTabProps {
  event: Event
}

export function EventComplianceTab({ event }: EventComplianceTabProps) {
  const updateEvent = useEventStore((s) => s.updateEvent)
  const [entries, setEntries] = useState<ComplianceEntry[]>(() => loadEntries(event))
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState<ComplianceEntry['category']>('safety')
  const [newStatus, setNewStatus] = useState<ComplianceEntry['status']>('ok')
  const [newNote, setNewNote] = useState('')

  function save(updated: ComplianceEntry[]) {
    setEntries(updated)
    updateEvent(event.id, { accessibilityNotes: encodeEntries(updated) })
  }

  function handleAdd() {
    const entry: ComplianceEntry = {
      id: crypto.randomUUID(),
      category: newCat,
      status: newStatus,
      note: newNote.trim(),
      createdAt: new Date().toISOString(),
    }
    save([...entries, entry])
    setNewNote('')
    setNewCat('safety')
    setNewStatus('ok')
    setShowAdd(false)
    toast.success('Compliance entry added')
  }

  function handleDelete(id: string) {
    save(entries.filter((e) => e.id !== id))
  }

  function handleStatusChange(id: string, status: ComplianceEntry['status']) {
    save(entries.map((e) => e.id === id ? { ...e, status } : e))
  }

  const flaggedCount = entries.filter((e) => e.status === 'flagged').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Compliance Log</h2>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-danger/10 text-danger text-xs px-2 py-0.5 font-medium">
              {flaggedCount} flagged
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add entry
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-border-default p-4 space-y-3 bg-surface">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Category</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as ComplianceEntry['category'])}
                className="w-full rounded-md border border-border-default bg-page px-2 py-1.5 text-sm text-text-primary"
              >
                {(Object.keys(CATEGORY_LABELS) as ComplianceEntry['category'][]).map((k) => (
                  <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplianceEntry['status'])}
                className="w-full rounded-md border border-border-default bg-page px-2 py-1.5 text-sm text-text-primary"
              >
                {(Object.keys(STATUS_LABELS) as ComplianceEntry['status'][]).map((k) => (
                  <option key={k} value={k}>{STATUS_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">Notes (optional)</label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Fire marshal approval received, max 50 guests confirmed..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 && !showAdd ? (
        <div className="text-center py-10 text-text-muted text-sm">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No compliance entries yet. Add fire, noise, capacity, or permit items.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border-default p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-text-primary">{CATEGORY_LABELS[entry.category]}</span>
                </div>
                {entry.note && <p className="text-sm text-text-secondary">{entry.note}</p>}
                <p className="text-xs text-text-muted mt-1">{new Date(entry.createdAt).toLocaleDateString('en-CA')}</p>
              </div>
              {/* Status toggle */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <select
                  value={entry.status}
                  onChange={(e) => handleStatusChange(entry.id, e.target.value as ComplianceEntry['status'])}
                  className={cn('rounded-full border-0 px-2 py-0.5 text-xs font-medium cursor-pointer', STATUS_STYLES[entry.status])}
                >
                  {(Object.keys(STATUS_LABELS) as ComplianceEntry['status'][]).map((k) => (
                    <option key={k} value={k}>{STATUS_LABELS[k]}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-text-muted hover:text-danger transition-colors p-0.5"
                  title="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
