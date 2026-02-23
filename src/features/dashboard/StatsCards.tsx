import { useMemo } from 'react'
import { Building2, CalendarDays, AlertCircle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useEventStore } from '@/lib/store/eventStore'
import { computeEventStatus } from '@/lib/store/eventStore'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Stats cards showing key metrics at the top of the dashboard.
 * Reads directly from Zustand stores — no props required.
 *
 * Cards:
 *  1. Total buildings
 *  2. Upcoming events (next 30 days)
 *  3. Events needing action (draft + needs_closeout)
 *  4. This month's RSVPs (sum of rsvpCount for events this month)
 */
export function StatsCards() {
  const buildings = useBuildingStore((s) => s.buildings)
  const events = useEventStore((s) => s.events)
  const getUpcomingEvents = useEventStore((s) => s.getUpcomingEvents)

  const totalBuildings = buildings.length

  const upcomingEvents = getUpcomingEvents(30).length

  const needingAction = useMemo(() => {
    return events.filter((e) => {
      const status = computeEventStatus(e)
      return status === 'draft' || status === 'needs_closeout'
    }).length
  }, [events])

  const thisMonthRSVPs = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    return events.reduce((total, event) => {
      if (!event.date) return total
      const eventDate = new Date(event.date + 'T00:00:00')
      if (
        eventDate.getFullYear() === currentYear &&
        eventDate.getMonth() === currentMonth
      ) {
        return total + event.rsvpCount
      }
      return total
    }, 0)
  }, [events])

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Dashboard statistics"
    >
      <StatCard
        label="Total Buildings"
        value={totalBuildings}
        icon={<Building2 className="h-5 w-5" />}
      />
      <StatCard
        label="Upcoming Events"
        value={upcomingEvents}
        icon={<CalendarDays className="h-5 w-5" />}
      />
      <StatCard
        label="Needing Action"
        value={needingAction}
        icon={<AlertCircle className="h-5 w-5" />}
      />
      <StatCard
        label="This Month's RSVPs"
        value={thisMonthRSVPs}
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  )
}
