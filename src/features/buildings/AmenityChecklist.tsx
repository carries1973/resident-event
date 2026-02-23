import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AMENITY_OPTIONS } from '@/lib/data/amenities'

interface AmenityChecklistProps {
  selected: string[]
  custom: string[]
  onSelectedChange: (amenities: string[]) => void
  onCustomChange: (custom: string[]) => void
}

export function AmenityChecklist({
  selected,
  custom,
  onSelectedChange,
  onCustomChange,
}: AmenityChecklistProps) {
  const [newCustom, setNewCustom] = useState('')

  function toggleAmenity(amenity: string) {
    if (selected.includes(amenity)) {
      onSelectedChange(selected.filter((a) => a !== amenity))
    } else {
      onSelectedChange([...selected, amenity])
    }
  }

  function addCustom() {
    const val = newCustom.trim()
    if (!val || custom.includes(val)) return
    onCustomChange([...custom, val])
    setNewCustom('')
  }

  function removeCustom(amenity: string) {
    onCustomChange(custom.filter((a) => a !== amenity))
  }

  return (
    <div className="space-y-4">
      {/* Preset amenities */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AMENITY_OPTIONS.map((amenity) => (
          <label
            key={amenity}
            className="flex items-center gap-2 text-sm cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selected.includes(amenity)}
              onChange={() => toggleAmenity(amenity)}
              className="h-4 w-4 rounded border-border-default text-brand focus:ring-brand"
            />
            <span className="text-text-primary">{amenity}</span>
          </label>
        ))}
      </div>

      {/* Custom amenities */}
      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {custom.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-medium"
            >
              {amenity}
              <button
                type="button"
                onClick={() => removeCustom(amenity)}
                aria-label={`Remove ${amenity}`}
                className="hover:text-danger transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {amenity}</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom amenity */}
      <div className="flex gap-2">
        <Input
          value={newCustom}
          onChange={(e) => setNewCustom(e.target.value)}
          placeholder="Add custom amenity"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustom}
          disabled={!newCustom.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
