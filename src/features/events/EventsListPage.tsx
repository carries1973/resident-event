import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { EventCard } from './EventCard'
import { EventsEmpty } from './EventsEmpty'
// EventStatus is used implicitly through filter values

export function EventsListPage() {
  const navigate = useNavigate()
  const events = useEventStore((s) => s.events)
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [buildingFilter, setBuildingFilter] = useState<string>(currentBuildingId ?? 'all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Get unique categories
  const categories = useMemo(
    () => [...new Set(events.map((e) => e.category).filter(Boolean))].sort(),
    [events],
  )

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Building filter
      if (buildingFilter !== 'all' && event.buildingId !== buildingFilter) return false

      // Status filter
      if (statusFilter !== 'all') {
        const computed = computeEventStatus(event)
        if (computed !== statusFilter) return false
      }

      // Category filter
      if (categoryFilter !== 'all' && event.category !== categoryFilter) return false

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const searchText = `${event.name} ${event.description} ${event.category} ${event.location} ${event.tags.join(' ')}`.toLowerCase()
        if (!searchText.includes(query)) return false
      }

      return true
    })
  }, [events, buildingFilter, statusFilter, categoryFilter, searchQuery])

  if (events.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Events</h1>
        </div>
        <EventsEmpty />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Events</h1>
        <Button onClick={() => navigate('/events/new')} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="needs_closeout">Needs closeout</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {buildings.length > 1 && (
          <Select value={buildingFilter} onValueChange={setBuildingFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buildings</SelectItem>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results */}
      {filteredEvents.length === 0 ? (
        <p className="text-center text-text-muted py-8">No events match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
