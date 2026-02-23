import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { Card, CardContent } from '@/components/ui/card'

export function PropertyProfilePage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Property Profile</h1>
        <p className="text-text-secondary mt-1">
          Manage your building profiles. Detailed profiles produce better AI-generated events.
        </p>
      </div>

      {buildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">No buildings yet</h2>
          <p className="text-text-secondary max-w-sm mb-4">
            Add your first building to get started with tailored event planning.
          </p>
          <Button onClick={() => navigate('/buildings/new')}>
            Add Building
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {buildings.map((building) => (
            <Card key={building.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {building.logoUrl ? (
                    <img
                      src={building.logoUrl}
                      alt={building.name}
                      className="h-10 w-10 rounded object-contain border border-border-default flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: building.brandColor || '#3B7BF4' }}
                    >
                      {building.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary truncate">{building.name}</p>
                    <p className="text-sm text-text-muted truncate">
                      {building.city}, {building.province}
                      {building.unitCount ? ` · ${building.unitCount} units` : ''}
                      {building.amenities?.length ? ` · ${building.amenities.length} amenities` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/buildings/${building.id}/edit`)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/buildings/new')}
          >
            Add Another Building
          </Button>
        </div>
      )}
    </div>
  )
}
