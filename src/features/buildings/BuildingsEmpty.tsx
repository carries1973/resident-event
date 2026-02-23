import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

export function BuildingsEmpty() {
  const navigate = useNavigate()

  return (
    <EmptyState
      icon={<Building2 />}
      title="No buildings yet"
      description="Add your first building to start planning events for your residents."
      actionLabel="Add building"
      onAction={() => navigate('/buildings/new')}
    />
  )
}
