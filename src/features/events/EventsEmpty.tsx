import { useNavigate } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

export function EventsEmpty() {
  const navigate = useNavigate()

  return (
    <EmptyState
      icon={<Calendar />}
      title="No events yet"
      description="Use the Event Planner to generate ideas, or create an event manually."
      actionLabel="Plan events"
      onAction={() => navigate('/planner')}
      secondaryActionLabel="Create manually"
      onSecondaryAction={() => navigate('/events/new')}
    />
  )
}
