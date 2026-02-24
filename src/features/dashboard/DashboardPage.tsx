import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarPlus,
  Building2,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { DashboardEmpty } from './DashboardEmpty'
import { WorkQueue } from './WorkQueue'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDateShort } from '@/lib/utils/dates'

const QUICK_IDEAS_STORAGE_KEY = 'rei-quick-ideas-sessions'

interface QuickIdeasSession {
  id: string
  topic: string
  building: string
  ideas: { name: string; description: string }[]
  createdAt: string
}

function loadQuickIdeasSessions(): QuickIdeasSession[] {
  try {
    const raw = localStorage.getItem(QUICK_IDEAS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)
  const events = useEventStore((s) => s.events)

  const isEmpty = buildings.length === 0 && events.length === 0

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Metrics — real data only, no fabricated numbers
  const metricsThisMonth = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        if (!event.date) return acc
        const d = new Date(event.date + 'T00:00:00')
        if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return acc
        const status = computeEventStatus(event)
        acc.planned++
        if (status === 'completed') acc.completed++
        return acc
      },
      { planned: 0, completed: 0 },
    )
  }, [events, currentYear, currentMonth])

  // Fallback: total scheduled/draft events across all time (used when month count is 0)
  const totalUpcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return events.filter((e) => {
      if (!e.date) return false
      const d = new Date(e.date + 'T00:00:00')
      const status = computeEventStatus(e)
      return d >= today && (status === 'scheduled' || status === 'active' || status === 'draft')
    }).length
  }, [events])

  // Next Action Required: unsaved Quick Ideas → draft events → no events nudge
  const nextAction = useMemo(() => {
    const sessions = loadQuickIdeasSessions()
    if (sessions.length > 0) {
      const s = sessions[0]
      // Normalize legacy "surprise me" topic stored before the naming fix
      const displayTopic =
        s.topic.toLowerCase() === 'surprise me' ? 'Surprise Mix' : s.topic
      // Use the top idea names as context instead of the raw session topic
      const ideaNames = s.ideas.slice(0, 2).map((i) => i.name).join(', ')
      const contextLabel = ideaNames
        ? `ideas including "${ideaNames}"`
        : `"${displayTopic}" ideas`
      return {
        label: `You have ${s.ideas.length} unsaved ${contextLabel} from your Quick Ideas session.`,
        cta: 'Go to Planner',
        action: () => navigate('/planner'),
      }
    }
    const drafts = events.filter((e) => computeEventStatus(e) === 'draft')
    if (drafts.length > 0) {
      const d = drafts[0]
      return {
        label: `"${d.name}" is a draft — set a date and schedule it.`,
        cta: 'Open event',
        action: () => navigate(`/events/${d.id}`),
      }
    }
    if (events.length === 0) {
      return {
        label: 'No events planned yet. Generate your first event ideas.',
        cta: 'Plan Events',
        action: () => navigate('/planner'),
      }
    }
    return null
  }, [events, navigate])

  // Recent events — last 3 by updatedAt
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
  }, [events])

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardEmpty />
      </div>
    )
  }

  const monthName = now.toLocaleString('en-CA', { month: 'long' })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/planner')}>
            <CalendarPlus className="h-4 w-4" />
            Plan Events
          </Button>
          <Button variant="outline" onClick={() => navigate('/buildings/new')}>
            <Building2 className="h-4 w-4" />
            Add Building
          </Button>
        </div>
      </div>

      {/* Next Action Required */}
      {nextAction && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                  Next Action Required
                </p>
                <p className="text-sm text-text-primary">{nextAction.label}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={nextAction.action}
              className="shrink-0 gap-1.5 border-primary text-primary hover:bg-primary/10"
            >
              {nextAction.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics — clickable cards navigating to filtered views */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-left group"
          aria-label={`View calendar for ${monthName}`}
        >
          <Card className="group-hover:border-primary/30 group-hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  {metricsThisMonth.planned > 0
                    ? `Events — ${monthName}`
                    : 'Upcoming Events'}
                </p>
                <p className="text-3xl font-bold text-text-primary">
                  {metricsThisMonth.planned > 0 ? metricsThisMonth.planned : totalUpcoming}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="text-left group"
          aria-label="View completed events"
        >
          <Card className="group-hover:border-success/30 group-hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-success/20 transition-colors">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Events Completed — {monthName}
                </p>
                <p className="text-3xl font-bold text-text-primary">{metricsThisMonth.completed}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Two-column: Work Queue + Recent Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkQueue />

        {/* Recent Events */}
        <Card>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Recent Events</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-text-muted"
                onClick={() => navigate('/events')}
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-6 w-6 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No events yet.</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 text-xs"
                  onClick={() => navigate('/planner')}
                >
                  Generate your first event →
                </Button>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentEvents.map((event) => {
                  const status = computeEventStatus(event)
                  const buildingName = buildings.find((b) => b.id === event.buildingId)?.name
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {event.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {event.date ? formatDateShort(event.date) : 'No date'}
                            {buildingName ? ` · ${buildingName}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
