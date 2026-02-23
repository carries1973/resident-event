import { useAppStore } from '@/lib/store/appStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EventStatus, ObservanceType } from '@/lib/types/common'

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'needs_closeout', label: 'Needs Closeout' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const OBSERVANCE_TYPE_OPTIONS: { value: ObservanceType; label: string }[] = [
  { value: 'national', label: 'National' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'religious', label: 'Religious' },
  { value: 'theme', label: 'Seasonal Theme' },
]

/**
 * CalendarFilters — filter controls for the calendar view.
 * Reads and writes calendar filter state from useAppStore.
 * Includes status checkboxes, building select, and observance type checkboxes.
 */
export function CalendarFilters() {
  const calendar = useAppStore((s) => s.calendar)
  const setCalendarStatusFilters = useAppStore((s) => s.setCalendarStatusFilters)
  const setCalendarBuildingFilter = useAppStore((s) => s.setCalendarBuildingFilter)
  const setCalendarObservanceTypeFilters = useAppStore(
    (s) => s.setCalendarObservanceTypeFilters,
  )
  const buildings = useBuildingStore((s) => s.buildings)

  function toggleStatusFilter(status: EventStatus) {
    const current = calendar.statusFilters

    if (current.length === 0) {
      // Currently showing all — user wants to EXCLUDE this status
      // So set filters to all statuses EXCEPT the clicked one
      const allStatuses = STATUS_OPTIONS.map((o) => o.value)
      setCalendarStatusFilters(allStatuses.filter((s) => s !== status))
    } else if (current.includes(status)) {
      // Remove this status from the include list
      const next = current.filter((s) => s !== status)
      // If removing makes it empty, reset to [] (show all) — but if the
      // user explicitly unchecked all, we keep it empty (no events shown)
      setCalendarStatusFilters(next)
    } else {
      // Add this status
      const next = [...current, status]
      // If all statuses are now selected, reset to [] (show all)
      if (next.length === STATUS_OPTIONS.length) {
        setCalendarStatusFilters([])
      } else {
        setCalendarStatusFilters(next)
      }
    }
  }

  function toggleObservanceTypeFilter(type: ObservanceType) {
    const current = calendar.observanceTypeFilters

    if (current.length === 0) {
      // Currently showing all — user wants to EXCLUDE this type
      const allTypes = OBSERVANCE_TYPE_OPTIONS.map((o) => o.value)
      setCalendarObservanceTypeFilters(allTypes.filter((t) => t !== type))
    } else if (current.includes(type)) {
      const next = current.filter((t) => t !== type)
      setCalendarObservanceTypeFilters(next)
    } else {
      const next = [...current, type]
      if (next.length === OBSERVANCE_TYPE_OPTIONS.length) {
        setCalendarObservanceTypeFilters([])
      } else {
        setCalendarObservanceTypeFilters(next)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          Event Status
        </h4>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => {
            const isChecked = calendar.statusFilters.length === 0 || calendar.statusFilters.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStatusFilter(option.value)}
                  className="h-4 w-4 rounded border-border-default text-brand focus:ring-brand/50 accent-brand"
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Building Filter */}
      {buildings.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Building
          </h4>
          <Select
            value={calendar.buildingFilter ?? 'all'}
            onValueChange={(value) =>
              setCalendarBuildingFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Observance Type Filters */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          Observances
        </h4>
        <div className="space-y-2">
          {OBSERVANCE_TYPE_OPTIONS.map((option) => {
            const isChecked =
              calendar.observanceTypeFilters.length === 0 ||
              calendar.observanceTypeFilters.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleObservanceTypeFilter(option.value)}
                  className="h-4 w-4 rounded border-border-default text-brand focus:ring-brand/50 accent-brand"
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
