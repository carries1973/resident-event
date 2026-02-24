import { useState } from 'react'
import { useEventStore } from '@/lib/store/eventStore'
import type { Event } from '@/lib/types/event'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Budget Tab — estimated vs actual line-item tracking
// ---------------------------------------------------------------------------

export interface BudgetLineItem {
  id: string
  description: string
  estimated: number
  actual: number
  category: 'venue' | 'food' | 'decor' | 'entertainment' | 'supplies' | 'other'
}

const CATEGORY_LABELS: Record<BudgetLineItem['category'], string> = {
  venue:         '🏠 Venue',
  food:          '🍕 Food & Drinks',
  decor:         '🎨 Decor',
  entertainment: '🎵 Entertainment',
  supplies:      '📦 Supplies',
  other:         '📝 Other',
}

const BUDGET_KEY = '__budget_items__'

function loadItems(event: Event): BudgetLineItem[] {
  try {
    const raw = event.budgetEstimate?.breakdown ?? ''
    if (!raw.startsWith(BUDGET_KEY)) return []
    return JSON.parse(raw.slice(BUDGET_KEY.length))
  } catch {
    return []
  }
}

function encodeItems(items: BudgetLineItem[]): string {
  return BUDGET_KEY + JSON.stringify(items)
}

interface EventBudgetTabProps {
  event: Event
}

export function EventBudgetTab({ event }: EventBudgetTabProps) {
  const updateEvent = useEventStore((s) => s.updateEvent)
  const [items, setItems] = useState<BudgetLineItem[]>(() => loadItems(event))
  const [showAdd, setShowAdd] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newEst, setNewEst] = useState('')
  const [newActual, setNewActual] = useState('')
  const [newCat, setNewCat] = useState<BudgetLineItem['category']>('other')

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0)
  const totalActual = items.reduce((s, i) => s + i.actual, 0)
  const diff = totalActual - totalEstimated
  const overBudget = diff > 0

  function save(updated: BudgetLineItem[]) {
    setItems(updated)
    // Persist items in breakdown field and update total
    const totalEst = updated.reduce((s, i) => s + i.estimated, 0)
    updateEvent(event.id, {
      budgetEstimate: {
        ...event.budgetEstimate,
        amount: totalEst,
        breakdown: encodeItems(updated),
      },
    })
  }

  function handleAdd() {
    if (!newDesc.trim()) { toast.error('Description is required'); return }
    const item: BudgetLineItem = {
      id: crypto.randomUUID(),
      description: newDesc.trim(),
      estimated: parseFloat(newEst) || 0,
      actual: parseFloat(newActual) || 0,
      category: newCat,
    }
    save([...items, item])
    setNewDesc(''); setNewEst(''); setNewActual(''); setNewCat('other')
    setShowAdd(false)
    toast.success('Line item added')
  }

  function handleDelete(id: string) {
    save(items.filter((i) => i.id !== id))
  }

  function handleActualChange(id: string, value: string) {
    save(items.map((i) => i.id === id ? { ...i, actual: parseFloat(value) || 0 } : i))
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border-default p-3">
          <p className="text-xs text-text-muted font-medium">Estimated</p>
          <p className="text-lg font-semibold text-text-primary mt-0.5">${totalEstimated.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border-default p-3">
          <p className="text-xs text-text-muted font-medium">Actual</p>
          <p className="text-lg font-semibold text-text-primary mt-0.5">${totalActual.toFixed(2)}</p>
        </div>
        <div className={cn('rounded-lg border p-3', overBudget ? 'border-danger/30 bg-danger/5' : 'border-success/30 bg-success/5')}>
          <p className="text-xs text-text-muted font-medium">Variance</p>
          <div className={cn('flex items-center gap-1 mt-0.5', overBudget ? 'text-danger' : diff < 0 ? 'text-success' : 'text-text-muted')}>
            {overBudget ? <TrendingUp className="h-4 w-4" /> : diff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            <span className="text-lg font-semibold">
              {diff === 0 ? '$0.00' : `${overBudget ? '+' : '-'}$${Math.abs(diff).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Header + add */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-text-muted" />
          Line Items
        </h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add item
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-border-default p-4 space-y-3 bg-surface">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-muted">Description</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="e.g. Catering, DJ, Room rental..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Category</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as BudgetLineItem['category'])}
                className="w-full rounded-md border border-border-default bg-page px-2 py-1.5 text-sm text-text-primary"
              >
                {(Object.keys(CATEGORY_LABELS) as BudgetLineItem['category'][]).map((k) => (
                  <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Estimated ($)</label>
              <Input type="number" min={0} step={0.01} value={newEst} onChange={(e) => setNewEst(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Actual ($)</label>
              <Input type="number" min={0} step={0.01} value={newActual} onChange={(e) => setNewActual(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Line items table */}
      {items.length === 0 && !showAdd ? (
        <div className="text-center py-10 text-text-muted text-sm">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No budget items yet. Add line items to track estimated vs actual spend.
        </div>
      ) : (
        <div className="rounded-lg border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted">Item</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-text-muted">Est.</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-text-muted">Actual</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-text-muted">Var.</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {items.map((item) => {
                const var_ = item.actual - item.estimated
                return (
                  <tr key={item.id} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-text-primary truncate max-w-[160px]">{item.description}</p>
                      <p className="text-xs text-text-muted">{CATEGORY_LABELS[item.category]}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">${item.estimated.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.actual || ''}
                        onChange={(e) => handleActualChange(item.id, e.target.value)}
                        className="w-20 text-right bg-transparent border-b border-border-default focus:border-accent-primary outline-none text-sm text-text-primary"
                        placeholder="0.00"
                      />
                    </td>
                    <td className={cn('px-3 py-2 text-right text-xs font-medium', var_ > 0 ? 'text-danger' : var_ < 0 ? 'text-success' : 'text-text-muted')}>
                      {var_ === 0 ? '—' : `${var_ > 0 ? '+' : ''}$${var_.toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-danger transition-colors p-0.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-surface-hover/50 font-semibold">
              <tr>
                <td className="px-3 py-2 text-text-primary text-xs">Total</td>
                <td className="px-3 py-2 text-right text-text-primary">${totalEstimated.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-text-primary">${totalActual.toFixed(2)}</td>
                <td className={cn('px-3 py-2 text-right text-xs', overBudget ? 'text-danger' : diff < 0 ? 'text-success' : 'text-text-muted')}>
                  {diff === 0 ? '—' : `${overBudget ? '+' : ''}$${diff.toFixed(2)}`}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
