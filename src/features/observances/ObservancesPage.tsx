import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/appStore'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'
import { ObservanceFilters } from './ObservanceFilters'
import { ObservanceList } from './ObservanceList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Observance } from '@/lib/types/observance'
import type { ObservanceType } from '@/lib/types/common'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMOJI_OPTIONS = ['🎉', '🏢', '🌟', '📅', '🎊', '🤝', '🏠', '❤️', '🎈', '🌸', '🍁', '☀️']

/**
 * ObservancesPage — main page for managing observances.
 * Route: /observances
 *
 * Pre-populated with DEFAULT_OBSERVANCES — this page is never empty per spec.
 * Users can filter by month and type, toggle observances on/off,
 * and add custom observances (building-specific dates, anniversaries).
 */
export function ObservancesPage() {
  const disabledObservanceIds = useAppStore((s) => s.disabledObservanceIds)
  const customObservances = useAppStore((s) => s.customObservances)
  const toggleObservance = useAppStore((s) => s.toggleObservance)
  const addCustomObservance = useAppStore((s) => s.addCustomObservance)
  const removeCustomObservance = useAppStore((s) => s.removeCustomObservance)

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state for custom observance
  const [newName, setNewName] = useState('')
  const [newMonth, setNewMonth] = useState('1')
  const [newDay, setNewDay] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎉')
  const [newType, setNewType] = useState<ObservanceType>('theme')
  const [newDescription, setNewDescription] = useState('')
  const [addError, setAddError] = useState('')

  const allObservances = useMemo(() => {
    return [...DEFAULT_OBSERVANCES, ...customObservances]
  }, [customObservances])

  const filteredObservances = useMemo(() => {
    return allObservances.filter((obs: Observance) => {
      if (selectedMonth !== null && obs.month !== selectedMonth) {
        return false
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(obs.type)) {
        return false
      }
      return true
    })
  }, [allObservances, selectedMonth, selectedTypes])

  const totalCount = allObservances.length
  const filteredCount = filteredObservances.length
  const customIds = new Set(customObservances.map((o) => o.id))

  function handleAddCustom() {
    const name = newName.trim()
    if (!name) {
      setAddError('Name is required.')
      return
    }
    setAddError('')

    const obs: Observance = {
      id: crypto.randomUUID(),
      name,
      month: Number(newMonth),
      day: newDay ? Number(newDay) : undefined,
      type: newType,
      emoji: newEmoji,
      description: newDescription.trim() || undefined,
      eventIdeas: [],
      enabled: true,
    }

    addCustomObservance(obs)

    // Reset form
    setNewName('')
    setNewDay('')
    setNewDescription('')
    setShowAddForm(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Observances</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage which observances appear on your calendar.
          </p>
        </div>
        <Button
          variant={showAddForm ? 'outline' : 'default'}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add custom'}
        </Button>
      </div>

      {/* Add Custom Observance Form */}
      {showAddForm && (
        <div className="rounded-lg border border-brand/30 bg-surface p-4 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Add custom observance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Name <span className="text-danger">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Building Anniversary"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Emoji
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Select emoji">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={newEmoji === e}
                    aria-label={`Emoji ${e}`}
                    onClick={() => setNewEmoji(e)}
                    className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-colors ${
                      newEmoji === e
                        ? 'bg-brand/20 ring-2 ring-brand'
                        : 'hover:bg-page'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Month
              </label>
              <Select value={newMonth} onValueChange={setNewMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Day <span className="text-text-muted font-normal">(optional — leave blank for month-long)</span>
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Type
              </label>
              <Select value={newType} onValueChange={(v) => setNewType(v as ObservanceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="theme">Seasonal Theme</SelectItem>
                  <SelectItem value="fun">Fun Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>

          {addError && (
            <p className="text-sm text-danger" role="alert">{addError}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleAddCustom}>Add observance</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border-default bg-surface p-4">
        <ObservanceFilters
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
        />
      </div>

      {/* Count */}
      <p className="text-sm text-text-muted">
        Showing {filteredCount} of {totalCount} observances
        {customObservances.length > 0 && (
          <span> ({customObservances.length} custom)</span>
        )}
      </p>

      {/* List */}
      <ObservanceList
        observances={filteredObservances}
        disabledIds={disabledObservanceIds}
        onToggle={toggleObservance}
        customIds={customIds}
        onRemoveCustom={removeCustomObservance}
      />
    </div>
  )
}
