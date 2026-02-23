import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Building2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useEventStore } from '@/lib/store/eventStore'
import { DashboardEmpty } from './DashboardEmpty'
import { StatsCards } from './StatsCards'
import { WorkQueue } from './WorkQueue'
import { RecentActivity } from './RecentActivity'

/**
 * Main dashboard page (route: /).
 *
 * Shows either:
 *  - DashboardEmpty when the user has no buildings and no events
 *  - Full dashboard with stats, work queue, and recent activity otherwise
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)
  const events = useEventStore((s) => s.events)

  const isEmpty = buildings.length === 0 && events.length === 0
  const hasBuildingsNoEvents = buildings.length > 0 && events.length === 0

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardEmpty />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with quick actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Nudge banner when buildings exist but no events */}
      {hasBuildingsNoEvents && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary mb-1">
              Ready to plan your first event?
            </h2>
            <p className="text-sm text-text-secondary">
              Your {buildings.length === 1 ? 'building is' : 'buildings are'} set up.
              Use the AI Event Planner to generate tailored event ideas.
            </p>
          </div>
          <Button onClick={() => navigate('/planner')} className="gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            Plan Events
          </Button>
        </div>
      )}

      {/* Stats overview */}
      <div className="mb-6">
        <StatsCards />
      </div>

      {/* Two-column layout: Work Queue (left) + Recent Activity (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkQueue />
        <RecentActivity />
      </div>
    </div>
  )
}
