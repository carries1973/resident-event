import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { useEventStore } from '@/lib/store/eventStore'
import { BuildingCard } from './BuildingCard'
import { BuildingsEmpty } from './BuildingsEmpty'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Building } from '@/lib/types/building'
import { toast } from 'sonner'

export function BuildingsListPage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)
  const duplicateBuilding = useBuildingStore((s) => s.duplicateBuilding)
  const deleteBuilding = useBuildingStore((s) => s.deleteBuilding)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const setCurrentBuildingId = useAppStore((s) => s.setCurrentBuildingId)
  const events = useEventStore((s) => s.events)

  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null)

  function handleDuplicate(id: string) {
    const dup = duplicateBuilding(id)
    if (dup) {
      toast.success(`Duplicated as "${dup.name}"`)
    }
  }

  function handleDelete(building: Building) {
    setDeleteTarget(building)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteBuilding(deleteTarget.id)
    // If the deleted building was selected, clear selection
    if (currentBuildingId === deleteTarget.id) {
      setCurrentBuildingId(null)
    }
    toast.success(`"${deleteTarget.name}" deleted`)
    setDeleteTarget(null)
  }

  // Count events associated with the building being deleted
  const affectedEventCount = deleteTarget
    ? events.filter((e) => e.buildingId === deleteTarget.id).length
    : 0

  if (buildings.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Buildings</h1>
        </div>
        <BuildingsEmpty />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Buildings</h1>
        <Button onClick={() => navigate('/buildings/new')} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add building
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buildings.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Delete confirmation with cascade warning */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete building"
        description={
          <span>
            This will permanently delete <strong>{deleteTarget?.name}</strong> and
            cannot be undone.
            {affectedEventCount > 0 && (
              <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                ⚠ {affectedEventCount} {affectedEventCount === 1 ? 'event is' : 'events are'} associated
                with this building and will become unlinked.
              </span>
            )}
            {' '}Type the building name to confirm.
          </span>
        }
        confirmText={deleteTarget?.name}
        confirmPlaceholder="Type building name"
        confirmLabel="Delete building"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
