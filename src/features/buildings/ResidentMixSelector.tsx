import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RESIDENT_OPTIONS } from '@/lib/data/residentTypes'

interface ResidentMixSelectorProps {
  primary: string
  secondary?: string
  onPrimaryChange: (value: string) => void
  onSecondaryChange: (value: string | undefined) => void
}

export function ResidentMixSelector({
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
}: ResidentMixSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Primary resident group
        </label>
        <Select value={primary} onValueChange={onPrimaryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select primary residents" />
          </SelectTrigger>
          <SelectContent>
            {RESIDENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-text-muted ml-2 text-xs">{opt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Secondary resident group <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <Select
          value={secondary ?? '__none__'}
          onValueChange={(val) => onSecondaryChange(val === '__none__' ? undefined : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select secondary residents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {RESIDENT_OPTIONS.filter((opt) => opt.id !== primary).map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-text-muted ml-2 text-xs">{opt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
