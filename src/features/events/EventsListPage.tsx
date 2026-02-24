import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Zap, Check, Clock, Circle, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
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
import { formatDateShort, formatTime } from '@/lib/utils/dates'
import type { Event } from '@/lib/types/event'
import type { EventStatus } from '@/lib/types/common'
import { cn } from '@/lib/utils'

// ── Status filter tabs config ──────────────────────────────────────────────
const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'In Progress' },
  { value: 'needs_closeout', label: 'Needs Closeout' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ── Status group ordering for grouped view ─────────────────────────────────
const STATUS_GROUP_ORDER: EventStatus[] = [
  'active',
  'needs_closeout',
  'scheduled',
  'draft',
  'completed',
  'cancelled',
  'archived',
]

const STATUS_GROUP_CONFIG: Record<
  EventStatus,
  { label: string; description: string; icon: React.ReactNode; accent: string }
> = {
  active: {
    label: 'Happening Now',
    description: 'Events happening today',
    icon: <Zap className="h-4 w-4 text-orange-500" />,
    accent: 'border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20',
  },
  needs_closeout: {
    label: 'Needs Closeout',
    description: 'Events that have ended and need closing',
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
    accent: 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
  },
  scheduled: {
    label: 'Scheduled',
    description: 'Confirmed upcoming events',
    icon: <Calendar className="h-4 w-4 text-blue-500" />,
    accent: 'border-blue-100 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/10',
  },
  draft: {
    label: 'Drafts',
    description: 'Unconfirmed events needing review',
    icon: <Circle className="h-4 w-4 text-yellow-500" />,
    accent: 'border-yellow-100 bg-yellow-50/30 dark:border-yellow-900 dark:bg-yellow-950/10',
  },
  completed: {
    label: 'Completed',
    description: 'Past events',
    icon: <Check className="h-4 w-4 text-emerald-500" />,
    accent: 'border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-900/20',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Cancelled events',
    icon: <Clock className="h-4 w-4 text-gray-400" />,
    accent: 'border-gray-100 bg-gray-50/30 dark:border-gray-800 dark:bg-gray-900/20',
  },
  archived: {
    label: 'Archived',
    description: 'Archived events',
    icon: <Clock className="h-4 w-4 text-gray-300" />,
    accent: 'border-gray-100 bg-gray-50/20 dark:border-gray-800 dark:bg-gray-900/10',
  },
}

// ── Inline event row for grouped view ─────────────────────────────────────
interface EventRowProps {
  event: Event
  displayStatus: EventStatus
}

function EventRow({ event, displayStatus }: EventRowProps) {
  const navigate = useNavigate()
  const transitionStatus = useEventStore((s) => s.transitionStatus)

  const isDraft = displayStatus === 'draft'
  const isActive = displayStatus === 'active'
  const isScheduled = displayStatus === 'scheduled'
  const isNeedsCloseout = displayStatus === 'needs_closeout'
  const isCompleted = displayStatus === 'completed' || displayStatus === 'archived'

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = transitionStatus(event.id, 'scheduled')
    if (ok) {
      toast.success(`"${event.name}" confirmed and scheduled.`)
    } else {
      toast.error('Cannot confirm — please ensure date, time, and location are set.')
    }
  }

  function handleUnconfirm(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = transitionStatus(event.id, 'draft')
    if (ok) {
      toast.success(`"${event.name}" moved back to Draft.`)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-hover',
        isDraft && 'border-dashed border-gray-300 dark:border-gray-700 opacity-70',
        isActive && 'border-orange-200 bg-orange-50/40 dark:border-orange-800 dark:bg-orange-950/20',
        isCompleted && 'opacity-55',
      )}
      onClick={() => navigate(`/events/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
      aria-label={`Open event: ${event.name}`}
    >
      {/* Status icon */}
      <span className="shrink-0">
        {isActive && <Zap className="h-4 w-4 text-orange-500" />}
        {isDraft && <Circle className="h-4 w-4 text-yellow-400" />}
        {isScheduled && <Calendar className="h-4 w-4 text-blue-400" />}
        {isNeedsCloseout && <AlertCircle className="h-4 w-4 text-amber-500" />}
        {isCompleted && <Check className="h-4 w-4 text-emerald-500" />}
        {displayStatus === 'cancelled' && <Clock className="h-4 w-4 text-gray-400" />}
      </span>

      {/* Event name + date */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isActive && 'text-orange-900 dark:text-orange-100',
          isCompleted && 'line-through text-text-muted',
          displayStatus === 'cancelled' && 'line-through text-text-muted',
        )}>
          {event.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {isActive && <span className="text-orange-600 dark:text-orange-400 font-medium">TODAY</span>}
          {isActive && ' · '}
          {event.date
            ? formatDateShort(event.date)
            : <span className="italic">No date set</span>}
          {event.startTime && ` · ${formatTime(event.startTime)}`}
          {event.endTime && ` – ${formatTime(event.endTime)}`}
          {event.location && ` · ${event.location}`}
        </p>
      </div>

      {/* Contextual action buttons */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isDraft && (
          <Button size="sm" variant="default" className="h-7 text-xs px-2.5" onClick={handleConfirm}>
            Confirm
          </Button>
        )}
        {isScheduled && (
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={handleUnconfirm}>
            Unconfirm
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-300"
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=dayof`) }}
          >
            Day-Of View
          </Button>
        )}
        {isNeedsCloseout && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300"
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=closeout`) }}
          >
            Closeout
          </Button>
        )}
        {isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2.5"
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}?tab=closeout`) }}
          >
            View Summary
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2.5"
          onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`) }}
        >
          View
        </Button>
      </div>
    </div>
  )
}

// ── Status group section ───────────────────────────────────────────────────
interface StatusGroupProps {
  status: EventStatus
  events: Event[]
}

function StatusGroup({ status, events }: StatusGroupProps) {
  const config = STATUS_GROUP_CONFIG[status]
  const [collapsed, setCollapsed] = useState(
    // Completed and cancelled start collapsed
    status === 'completed' || status === 'cancelled' || status === 'archived',
  )

  if (events.length === 0) return null

  return (
    <div className={cn('rounded-lg border p-4 space-y-2', config.accent)}>
      {/* Section header */}
      <button
        type="button"
        className="flex items-center justify-between w-full text-left gap-2"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-semibold text-text-primary">{config.label}</span>
          <span className="text-xs text-text-muted bg-white/60 dark:bg-black/20 rounded-full px-1.5 py-0.5 border border-white/40 dark:border-black/10">
            {events.length}
          </span>
        </div>
        <span className="text-xs text-text-muted">{collapsed ? 'Show' : 'Hide'}</span>
      </button>

      {/* Event rows */}
      {!collapsed && (
        <div className="space-y-1.5 mt-1">
          {events.map((event) => (
            <EventRow key={event.id} event={event} displayStatus={status} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export function EventsListPage() {
  const navigate = useNavigate()
  const events = useEventStore((s) => s.events)
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [buildingFilter, setBuildingFilter] = useState<string>(currentBuildingId ?? 'all')

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (buildingFilter !== 'all' && event.buildingId !== buildingFilter) return false

      if (statusFilter !== 'all') {
        const computed = computeEventStatus(event)
        if (computed !== statusFilter) return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const searchText = `${event.name} ${event.description} ${event.category} ${event.location} ${event.tags.join(' ')}`.toLowerCase()
        if (!searchText.includes(query)) return false
      }

      return true
    })
  }, [events, buildingFilter, statusFilter, searchQuery])

  // When not filtering by a specific status, group events by computed status
  const grouped = useMemo(() => {
    if (statusFilter !== 'all') return null

    const groups = new Map<EventStatus, Event[]>()
    for (const event of filteredEvents) {
      const s = computeEventStatus(event)
      if (!groups.has(s)) groups.set(s, [])
      groups.get(s)!.push(event)
    }
    return groups
  }, [filteredEvents, statusFilter])

  // Count per status tab (for badge numbers)
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: events.length }
    for (const event of events) {
      const s = computeEventStatus(event)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [events])

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">Events</h1>
        <Button onClick={() => navigate('/events/new')} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New event
        </Button>
      </div>

      {/* Search + building filter row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="pl-9"
          />
        </div>

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
      </div>

      {/* Status filter tab row */}
      <div className="flex flex-wrap gap-1.5 mb-5 border-b border-border-default pb-3">
        {STATUS_TABS.map((tab) => {
          const count = countsByStatus[tab.value] ?? 0
          const isActive = statusFilter === tab.value
          // Hide tabs with no events (except "all")
          if (tab.value !== 'all' && count === 0) return null
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                isActive
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-text-secondary border-border-default hover:text-text-primary hover:border-brand/30',
              )}
            >
              {tab.label}
              {tab.value !== 'all' && count > 0 && (
                <span className={cn(
                  'rounded-full px-1 min-w-[18px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-page text-text-muted',
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Results */}
      {filteredEvents.length === 0 ? (
        <p className="text-center text-text-muted py-8">No events match your filters.</p>
      ) : statusFilter !== 'all' ? (
        // Single-status filter: grid card view
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        // All events: grouped by status sections
        <div className="space-y-3">
          {STATUS_GROUP_ORDER.map((status) => {
            const groupEvents = grouped?.get(status) ?? []
            return (
              <StatusGroup
                key={status}
                status={status}
                events={groupEvents}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
