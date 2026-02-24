// ---------------------------------------------------------------------------
// AddressAutocomplete — Nominatim-powered address search
// ---------------------------------------------------------------------------
// Uses OpenStreetMap's Nominatim API (free, no API key required).
// On selection: fills city and province from the result.
// Rate-limited to 1 req/sec (Nominatim ToS requirement).
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CANADIAN_PROVINCES } from '@/lib/types/common'

interface NominatimResult {
  place_id: number
  display_name: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    state_code?: string
    postcode?: string
    country_code?: string
  }
}

interface AddressSelection {
  address: string    // street address line (number + road)
  city: string
  province: string   // Canadian province code e.g. "AB"
  postalCode: string // Canadian postal code e.g. "T2P 1J9"
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (selection: AddressSelection) => void
  placeholder?: string
  className?: string
}

// Map Nominatim state names → Canadian province codes
const PROVINCE_NAME_MAP: Record<string, string> = {
  'alberta': 'AB',
  'british columbia': 'BC',
  'manitoba': 'MB',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'northwest territories': 'NT',
  'nova scotia': 'NS',
  'nunavut': 'NU',
  'ontario': 'ON',
  'prince edward island': 'PE',
  'quebec': 'QC',
  'québec': 'QC',
  'saskatchewan': 'SK',
  'yukon': 'YT',
}

function parseProvinceCode(state?: string): string {
  if (!state) return ''
  const lower = state.toLowerCase().trim()
  // Direct code match (Nominatim sometimes returns "AB")
  const directMatch = CANADIAN_PROVINCES.find((p) => p.value === state.toUpperCase())
  if (directMatch) return directMatch.value
  // Name match
  return PROVINCE_NAME_MAP[lower] ?? ''
}

function buildStreetAddress(addr: NominatimResult['address']): string {
  const parts = [addr.house_number, addr.road].filter(Boolean)
  return parts.join(' ')
}

function getCity(addr: NominatimResult['address']): string {
  return addr.city ?? addr.town ?? addr.municipality ?? addr.village ?? ''
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '123 Main Street',
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounced search — 400ms after user stops typing
  const search = useCallback((query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (!query.trim() || query.length < 4) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          countrycodes: 'ca',   // Canada only
          limit: '6',
        })
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              'Accept-Language': 'en',
              // Required by Nominatim ToS: identify the app
              'User-Agent': 'ResidentEventIdeas/1.0 (events.pcgproperty.com)',
            },
            signal: abortRef.current.signal,
          },
        )
        if (!res.ok) throw new Error('Nominatim error')
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
        setHighlightIndex(-1)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [])

  useEffect(() => {
    search(value)
  }, [value, search])

  // Outside-click close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(result: NominatimResult) {
    const city = getCity(result.address)
    const province = parseProvinceCode(result.address.state ?? result.address.state_code)
    const streetAddress = buildStreetAddress(result.address)
    // Nominatim returns Canadian postal codes with a space (e.g., "T2P 1J9")
    const postalCode = result.address.postcode ?? ''

    // Update the raw input value to show the selected street address
    onChange(streetAddress || result.display_name.split(',')[0].trim())
    onSelect({ address: streetAddress, city, province, postalCode })
    setSuggestions([])
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-border-default bg-surface shadow-elevated max-h-60 overflow-y-auto"
        >
          {suggestions.map((result, index) => {
            const city = getCity(result.address)
            const province = parseProvinceCode(result.address.state ?? result.address.state_code)
            const street = buildStreetAddress(result.address)
            const mainLine = street || result.display_name.split(',')[0].trim()
            const subLine = [city, province].filter(Boolean).join(', ')

            return (
              <li
                key={result.place_id}
                role="option"
                aria-selected={index === highlightIndex}
                className={cn(
                  'flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors text-sm',
                  index === highlightIndex
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'hover:bg-surface-hover text-text-primary',
                  index > 0 && 'border-t border-border-default/50',
                )}
                onMouseDown={(e) => {
                  e.preventDefault() // prevent input blur before click
                  handleSelect(result)
                }}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-text-muted" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{mainLine}</p>
                  {subLine && (
                    <p className="text-xs text-text-muted truncate">{subLine}</p>
                  )}
                </div>
              </li>
            )
          })}
          <li className="px-3 py-1.5 text-[10px] text-text-muted border-t border-border-default/50">
            © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  )
}
