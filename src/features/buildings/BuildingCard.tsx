import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import type { Building } from '@/lib/types/building'

interface BuildingCardProps {
  building: Building
  onDuplicate: (id: string) => void
  onDelete: (building: Building) => void
}

export function BuildingCard({ building, onDuplicate, onDelete }: BuildingCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="group cursor-pointer hover:border-brand/30 transition-colors"
      onClick={() => navigate(`/buildings/${building.id}/edit`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {building.logoUrl ? (
              <img
                src={building.logoUrl}
                alt=""
                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex-shrink-0"
                style={{ backgroundColor: building.brandColor }}
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {building.name}
              </h3>
              <p className="text-sm text-text-secondary truncate">
                {building.city}, {building.province}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 min-h-[44px] min-w-[44px] opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/buildings/${building.id}/edit`)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(building.id)
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-danger focus:text-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(building)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-text-muted">
          {building.unitCount != null && building.unitCount > 0 && (
            <span>{building.unitCount} units</span>
          )}
          {(building.amenities?.length ?? 0) > 0 && (
            <span>{building.amenities.length} amenities</span>
          )}
          {building.primaryResidentGroup && (
            <span>{building.primaryResidentGroup}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
