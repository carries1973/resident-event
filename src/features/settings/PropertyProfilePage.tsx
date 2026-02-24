import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Pencil,
  Plus,
  CheckCircle2,
  AlertCircle,
  Palette,
  Users,
  Layers,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { RESIDENT_OPTIONS } from '@/lib/data/residentTypes'
import { cn } from '@/lib/utils'
import type { Building } from '@/lib/types/building'

// ---------------------------------------------------------------------------
// Profile completeness calculator
// ---------------------------------------------------------------------------

interface CompletenessSection {
  label: string
  filled: number
  total: number
  icon: React.ReactNode
}

function getBuildingCompleteness(building: Building): CompletenessSection[] {
  return [
    {
      label: 'Basic info',
      icon: <Building2 className="h-3.5 w-3.5" />,
      filled: [building.name, building.city, building.province, building.address, building.propertyType, building.unitCount].filter(Boolean).length,
      total: 6,
    },
    {
      label: 'Amenities',
      icon: <Layers className="h-3.5 w-3.5" />,
      filled: building.amenities.length + building.customAmenities.length > 0 ? 1 : 0,
      total: 1,
    },
    {
      label: 'Resident mix',
      icon: <Users className="h-3.5 w-3.5" />,
      filled: [building.primaryResidentGroup, building.secondaryResidentGroup].filter(Boolean).length,
      total: 2,
    },
    {
      label: 'Branding',
      icon: <Palette className="h-3.5 w-3.5" />,
      filled: [building.brandColor !== '#3B7BF4' || building.logoUrl, building.brandTones?.length > 0, building.wordsToUse?.length > 0].filter(Boolean).length,
      total: 3,
    },
    {
      label: 'Budget',
      icon: <DollarSign className="h-3.5 w-3.5" />,
      filled: building.defaultBudgetTier ? 1 : 0,
      total: 1,
    },
  ]
}

function overallCompletion(sections: CompletenessSection[]): number {
  const totalFilled = sections.reduce((sum, s) => sum + s.filled, 0)
  const totalPossible = sections.reduce((sum, s) => sum + s.total, 0)
  return totalPossible > 0 ? Math.round((totalFilled / totalPossible) * 100) : 0
}

// ---------------------------------------------------------------------------
// Building profile card
// ---------------------------------------------------------------------------

function BuildingProfileCard({ building }: { building: Building }) {
  const navigate = useNavigate()
  const sections = getBuildingCompleteness(building)
  const pct = overallCompletion(sections)
  const persona = RESIDENT_OPTIONS.find((p) => p.id === building.primaryResidentGroup)
  const allAmenities = [...(building.amenities ?? []), ...(building.customAmenities ?? [])]

  const completionColour =
    pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger'
  const barColour =
    pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger'

  return (
    <Card className="overflow-hidden">
      {/* Brand colour accent */}
      <div className="h-1.5" style={{ backgroundColor: building.brandColor || '#3B7BF4' }} />

      <CardContent className="p-5 space-y-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {building.logoUrl ? (
            <img
              src={building.logoUrl}
              alt={building.name}
              className="h-14 w-14 rounded-xl object-contain border border-border-default flex-shrink-0"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: building.brandColor || '#3B7BF4' }}
            >
              {building.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-text-primary text-lg truncate">{building.name}</h2>
            <p className="text-sm text-text-muted truncate">
              {[building.address, building.city, building.province].filter(Boolean).join(', ')}
            </p>
            {building.unitCount && (
              <p className="text-xs text-text-muted mt-0.5">{building.unitCount} units</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-1"
            onClick={() => navigate(`/buildings/${building.id}/edit`)}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </div>

        {/* Completeness bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Profile completeness</span>
            <span className={cn('text-xs font-bold', completionColour)}>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-page overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColour)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
            {sections.map((s) => (
              <div key={s.label} className="flex items-center gap-1 text-[11px]">
                {s.filled === s.total ? (
                  <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-warning flex-shrink-0" />
                )}
                <span className={s.filled === s.total ? 'text-text-muted' : 'text-warning'}>
                  {s.label}
                  {s.filled < s.total && ` (${s.filled}/${s.total})`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Resident group */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Primary residents
            </p>
            {persona ? (
              <div className="space-y-0.5">
                <p className="text-text-primary font-medium">{persona.label}</p>
                <p className="text-xs text-text-muted">{persona.ageRange} · {persona.incomeRange}</p>
                <p className="text-xs text-text-muted italic">{persona.description}</p>
              </div>
            ) : (
              <p className="text-text-muted text-xs italic">Not set — add resident mix to improve AI results</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              Branding
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded border border-border-default flex-shrink-0"
                  style={{ backgroundColor: building.brandColor || '#3B7BF4' }}
                />
                <span className="text-xs text-text-secondary font-mono">{building.brandColor || '#3B7BF4'}</span>
              </div>
              {building.brandTones?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {building.brandTones.map((t) => (
                    <span key={t} className="rounded-full bg-page border border-border-default px-2 py-0.5 text-[10px] text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Default budget tier
            </p>
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              building.defaultBudgetTier === 'premium'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : building.defaultBudgetTier === 'moderate'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-page text-text-secondary border border-border-default',
            )}>
              {building.defaultBudgetTier ? building.defaultBudgetTier.charAt(0).toUpperCase() + building.defaultBudgetTier.slice(1) : 'Not set'}
            </span>
          </div>

          {/* Amenities count */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Amenities
            </p>
            {allAmenities.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {allAmenities.slice(0, 4).map((a) => (
                  <span key={a} className="rounded-full bg-page border border-border-default px-2 py-0.5 text-[10px] text-text-muted">
                    {a}
                  </span>
                ))}
                {allAmenities.length > 4 && (
                  <span className="rounded-full bg-page border border-border-default px-2 py-0.5 text-[10px] text-text-muted">
                    +{allAmenities.length - 4} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No amenities added</p>
            )}
          </div>
        </div>

        {/* AI tip if incomplete */}
        {pct < 80 && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>A more complete profile improves AI event suggestions. Fill in Resident Mix and Amenities for best results.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PropertyProfilePage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Property Profile</h1>
          <p className="text-text-secondary mt-1">
            Manage your building profiles. A complete profile produces better AI-generated events and marketing copy.
          </p>
        </div>
        <Button onClick={() => navigate('/buildings/new')} className="gap-1.5 flex-shrink-0">
          <Plus className="h-4 w-4" />
          Add Building
        </Button>
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
        <div className="space-y-4">
          {buildings.map((building) => (
            <BuildingProfileCard key={building.id} building={building} />
          ))}
        </div>
      )}
    </div>
  )
}
