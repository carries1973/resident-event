import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, Sparkles } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useEventStore } from '@/lib/store/eventStore'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'
import type { Observance } from '@/lib/types/observance'

const MAX_RESULTS_PER_GROUP = 5

interface SearchPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const buildings = useBuildingStore((state) => state.buildings)
  const events = useEventStore((state) => state.events)

  const filteredBuildings = useMemo(() => {
    if (!query.trim()) return buildings.slice(0, MAX_RESULTS_PER_GROUP)

    const lowerQuery = query.toLowerCase().trim()
    return buildings
      .filter(
        (building) =>
          building.name.toLowerCase().includes(lowerQuery) ||
          building.city.toLowerCase().includes(lowerQuery),
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
  }, [buildings, query])

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return events.slice(0, MAX_RESULTS_PER_GROUP)

    const lowerQuery = query.toLowerCase().trim()
    return events
      .filter(
        (event) =>
          event.name.toLowerCase().includes(lowerQuery) ||
          event.description.toLowerCase().includes(lowerQuery) ||
          event.category.toLowerCase().includes(lowerQuery),
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
  }, [events, query])

  const filteredObservances: Observance[] = useMemo(() => {
    if (!query.trim()) return DEFAULT_OBSERVANCES.slice(0, MAX_RESULTS_PER_GROUP)

    const lowerQuery = query.toLowerCase().trim()
    return DEFAULT_OBSERVANCES.filter((observance) =>
      observance.name.toLowerCase().includes(lowerQuery),
    ).slice(0, MAX_RESULTS_PER_GROUP)
  }, [query])

  const hasResults =
    filteredBuildings.length > 0 ||
    filteredEvents.length > 0 ||
    filteredObservances.length > 0

  function handleSelect(callback: () => void) {
    onOpenChange(false)
    setQuery('')
    callback()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) setQuery('')
      }}
      title="Search"
      description="Search across buildings, events, and observances."
    >
      <CommandInput
        placeholder="Search buildings, events, and observances..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!hasResults && <CommandEmpty>No results found.</CommandEmpty>}

        {filteredBuildings.length > 0 && (
          <CommandGroup heading="Buildings">
            {filteredBuildings.map((building) => (
              <CommandItem
                key={building.id}
                value={`building-${building.id}-${building.name}`}
                onSelect={() =>
                  handleSelect(() => navigate(`/buildings/${building.id}/edit`))
                }
              >
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium">{building.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {building.city}, {building.province}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredBuildings.length > 0 && filteredEvents.length > 0 && (
          <CommandSeparator />
        )}

        {filteredEvents.length > 0 && (
          <CommandGroup heading="Events">
            {filteredEvents.map((event) => (
              <CommandItem
                key={event.id}
                value={`event-${event.id}-${event.name}`}
                onSelect={() =>
                  handleSelect(() => navigate(`/events/${event.id}`))
                }
              >
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium">{event.name}</span>
                  {(event.category || event.date) && (
                    <span className="truncate text-xs text-muted-foreground">
                      {[event.category, event.date].filter(Boolean).join(' \u00B7 ')}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(filteredBuildings.length > 0 || filteredEvents.length > 0) &&
          filteredObservances.length > 0 && <CommandSeparator />}

        {filteredObservances.length > 0 && (
          <CommandGroup heading="Observances">
            {filteredObservances.map((observance) => (
              <CommandItem
                key={observance.id}
                value={`observance-${observance.id}-${observance.name}`}
                onSelect={() =>
                  handleSelect(() => navigate('/observances'))
                }
              >
                <Sparkles className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium">
                    {observance.emoji} {observance.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {observance.type.charAt(0).toUpperCase() + observance.type.slice(1)}
                    {observance.day
                      ? ` \u00B7 ${observance.day}/${observance.month}`
                      : ` \u00B7 Month ${observance.month}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
