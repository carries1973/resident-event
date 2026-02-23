import { Building2, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/**
 * Building selector dropdown — shown in the top bar.
 * Only appears when user has 2+ buildings.
 */
export function BuildingSelector() {
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const setCurrentBuildingId = useAppStore((s) => s.setCurrentBuildingId)

  // Don't render if 0-1 buildings
  if (buildings.length <= 1) return null

  const current = buildings.find((b) => b.id === currentBuildingId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {current?.name ?? 'All buildings'}
          </span>
          <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => setCurrentBuildingId(null)}>
          <span className="font-medium">All buildings</span>
        </DropdownMenuItem>
        {buildings.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => setCurrentBuildingId(b.id)}
          >
            <div className="flex items-center gap-2">
              {b.logoUrl ? (
                <img
                  src={b.logoUrl}
                  alt={`${b.name} logo`}
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div
                  className="h-5 w-5 rounded"
                  style={{ backgroundColor: b.brandColor }}
                />
              )}
              <span className="truncate">{b.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
