import { useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

/**
 * Dashboard empty state — shown when the user has no buildings and no events.
 * Provides clear calls-to-action to get started with the planner or buildings.
 */
export function DashboardEmpty() {
  const navigate = useNavigate()

  return (
    <EmptyState
      icon={<CalendarPlus />}
      title="No activity yet"
      description="Start by planning your first event. You can also add a building to personalise your experience."
      actionLabel="Plan Your First Event"
      onAction={() => navigate('/planner')}
      secondaryActionLabel="Add a Building"
      onSecondaryAction={() => navigate('/buildings')}
    />
  )
}
