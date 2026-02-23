import { Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const

const TYPE_OPTIONS = [
  { value: 'national', label: 'National' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'religious', label: 'Religious' },
  { value: 'theme', label: 'Seasonal Theme' },
] as const

interface ObservanceFiltersProps {
  selectedMonth: number | null
  onMonthChange: (month: number | null) => void
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
}

/**
 * ObservanceFilters — filter controls for the observances list.
 * Includes a month selector dropdown and type filter checkboxes.
 */
export function ObservanceFilters({
  selectedMonth,
  onMonthChange,
  selectedTypes,
  onTypesChange,
}: ObservanceFiltersProps) {
  function handleMonthChange(value: string) {
    onMonthChange(value === 'all' ? null : Number(value))
  }

  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
      {/* Month Selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-text-muted" />
          Month
        </label>
        <Select
          value={selectedMonth !== null ? String(selectedMonth) : 'all'}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter Checkboxes */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-text-primary">Type</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {TYPE_OPTIONS.map((option) => {
            const isChecked =
              selectedTypes.length === 0 || selectedTypes.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleType(option.value)}
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
