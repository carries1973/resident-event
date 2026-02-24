import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Check, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuildingStore, useBuildingStoreHydrated } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { createDefaultBuilding, ensureBuildingDefaults, type Building } from '@/lib/types/building'
import { CANADIAN_PROVINCES } from '@/lib/types/common'
import type { PropertyType, PrimaryUse, BudgetTier } from '@/lib/types/common'
import { countFilledFields } from '@/lib/utils/validation'
import { UnsavedChangesGuard } from '@/components/common/UnsavedChangesGuard'
import { AmenityChecklist } from './AmenityChecklist'
import { ResidentMixSelector } from './ResidentMixSelector'
import { BrandingSection } from './BrandingSection'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type FormSection = 'basic' | 'amenities' | 'local-context' | 'residents' | 'branding' | 'brand-tone' | 'operations'

const SECTION_FIELDS: Record<FormSection, string[]> = {
  basic: ['name', 'address', 'city', 'province', 'propertyType', 'unitCount', 'primaryUse'],
  amenities: ['amenities', 'customAmenities'],
  'local-context': ['nearbyVenues'],
  residents: ['primaryResidentGroup', 'secondaryResidentGroup'],
  branding: ['logoUrl', 'brandColor'],
  'brand-tone': ['brandTones', 'wordsToUse', 'wordsToAvoid'],
  operations: ['defaultBudgetTier', 'preferredEventDays', 'staffCapacity', 'noiseRestrictions', 'accessibilityNotes'],
}

export function BuildingFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const hasHydrated = useBuildingStoreHydrated()
  const existingBuilding = useBuildingStore((s) =>
    id ? s.buildings.find((b) => b.id === id) : undefined,
  )
  const createBuilding = useBuildingStore((s) => s.createBuilding)
  const updateBuilding = useBuildingStore((s) => s.updateBuilding)
  const setCurrentBuildingId = useAppStore((s) => s.setCurrentBuildingId)

  // Form state — clone existing or create defaults
  // ensureBuildingDefaults() guards against stale persisted buildings missing array fields
  const [form, setForm] = useState<Building>(() =>
    existingBuilding
      ? ensureBuildingDefaults({ ...existingBuilding })
      : createDefaultBuilding({ name: '', city: '', province: '' }),
  )

  const [isDirty, setIsDirty] = useState(false)
  const [openSections, setOpenSections] = useState<Set<FormSection>>(
    new Set(['basic']),
  )
  const [errors, setErrors] = useState<string[]>([])

  // Re-sync form if navigating to a different building
  useEffect(() => {
    if (existingBuilding) {
      setForm(ensureBuildingDefaults({ ...existingBuilding }))
      setIsDirty(false)
    }
  }, [existingBuilding])

  // Redirect if editing a non-existent building (only after store has hydrated)
  useEffect(() => {
    if (hasHydrated && id && !existingBuilding) {
      navigate('/buildings', { replace: true })
    }
  }, [hasHydrated, id, existingBuilding, navigate])

  // Wait for store to hydrate before rendering (prevents flash on page refresh)
  if (id && !hasHydrated) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">Loading&hellip;</p>
      </div>
    )
  }

  // Show not-found message while redirecting
  if (id && hasHydrated && !existingBuilding) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted">Building not found. Redirecting&hellip;</p>
      </div>
    )
  }

  function updateField<K extends keyof Building>(key: K, value: Building[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  function toggleSection(section: FormSection) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!form.name.trim()) errs.push('Building name is required.')
    if (!form.city.trim()) errs.push('City is required.')
    if (!form.province) errs.push('Province is required.')

    if (errs.length > 0) {
      setErrors(errs)
      // Ensure basic section is open
      setOpenSections((prev) => new Set([...prev, 'basic']))
      return
    }

    setErrors([])

    if (isEditing && id) {
      // Normalize city capitalization on save (title-case each word)
      const normalizedCity = form.city
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      updateBuilding(id, { ...form, city: normalizedCity, updatedAt: new Date().toISOString() })
      toast.success(`"${form.name}" updated`)
    } else {
      // Normalize city capitalization on save (title-case each word)
      const normalizedCity = form.city
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const building = createBuilding({
        ...form,
        name: form.name.trim(),
        city: normalizedCity,
      })
      setCurrentBuildingId(building.id)
      toast.success(`"${building.name}" created`)
    }
    setIsDirty(false)
    navigate('/buildings')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <UnsavedChangesGuard hasUnsavedChanges={isDirty} />

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {isEditing ? `Edit ${existingBuilding?.name ?? 'Building'}` : 'New building'}
      </h1>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-danger/20 p-3 mb-6">
          {errors.map((err) => (
            <p key={err} className="text-sm text-danger">{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Section: Basic Information */}
        <CollapsibleSection
          title="Basic information"
          section="basic"
          open={openSections.has('basic')}
          onToggle={() => toggleSection('basic')}
          completion={countFilledFields(form as unknown as Record<string, unknown>, SECTION_FIELDS.basic)}
          required
        >
          <div className="space-y-4">
            <Field label="Building name" required>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder='e.g., "The Windsor"'
                autoFocus={!isEditing}
              />
            </Field>

            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City" required>
                <Input
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Calgary"
                />
              </Field>
              <Field label="Province" required>
                <Select value={form.province} onValueChange={(v) => updateField('province', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANADIAN_PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Property type">
                <Select
                  value={form.propertyType}
                  onValueChange={(v) => updateField('propertyType', v as PropertyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental_apartment">Rental apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="mixed_use">Mixed use</SelectItem>
                    <SelectItem value="townhomes">Townhomes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Units">
                <Input
                  type="number"
                  min={0}
                  value={form.unitCount ?? ''}
                  onChange={(e) =>
                    updateField('unitCount', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="e.g., 120"
                />
              </Field>
              <Field label="Primary use">
                <Select
                  value={form.primaryUse}
                  onValueChange={(v) => updateField('primaryUse', v as PrimaryUse)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long_term_rental">Long-term rental</SelectItem>
                    <SelectItem value="owner_occupied">Owner-occupied</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section: Amenities */}
        <CollapsibleSection
          title="Amenities"
          section="amenities"
          open={openSections.has('amenities')}
          onToggle={() => toggleSection('amenities')}
          completion={{
            filled: form.amenities.length + form.customAmenities.length,
            total: 1, // just indicate "has any"
          }}
          summary={
            form.amenities.length + form.customAmenities.length > 0
              ? `${form.amenities.length + form.customAmenities.length} selected`
              : undefined
          }
        >
          <AmenityChecklist
            selected={form.amenities}
            custom={form.customAmenities}
            onSelectedChange={(amenities) => {
              updateField('amenities', amenities)
            }}
            onCustomChange={(custom) => {
              updateField('customAmenities', custom)
            }}
          />
        </CollapsibleSection>

        {/* Section: Local Context */}
        <CollapsibleSection
          title="Nearby venues"
          section="local-context"
          open={openSections.has('local-context')}
          onToggle={() => toggleSection('local-context')}
          completion={{
            filled: form.nearbyVenues.length,
            total: 1,
          }}
          summary={
            form.nearbyVenues.length > 0
              ? `${form.nearbyVenues.length} venue${form.nearbyVenues.length === 1 ? '' : 's'}`
              : undefined
          }
        >
          <NearbyVenuesInput
            venues={form.nearbyVenues}
            onChange={(venues) => updateField('nearbyVenues', venues)}
          />
        </CollapsibleSection>

        {/* Section: Resident Mix */}
        <CollapsibleSection
          title="Resident mix"
          section="residents"
          open={openSections.has('residents')}
          onToggle={() => toggleSection('residents')}
          completion={countFilledFields(form as unknown as Record<string, unknown>, SECTION_FIELDS.residents)}
        >
          <ResidentMixSelector
            primary={form.primaryResidentGroup}
            secondary={form.secondaryResidentGroup}
            onPrimaryChange={(v) => updateField('primaryResidentGroup', v)}
            onSecondaryChange={(v) => updateField('secondaryResidentGroup', v)}
          />
        </CollapsibleSection>

        {/* Section: Branding */}
        <CollapsibleSection
          title="Branding"
          section="branding"
          open={openSections.has('branding')}
          onToggle={() => toggleSection('branding')}
          completion={countFilledFields(form as unknown as Record<string, unknown>, SECTION_FIELDS.branding)}
        >
          <BrandingSection
            logoUrl={form.logoUrl}
            brandColor={form.brandColor}
            brandTones={form.brandTones}
            wordsToUse={form.wordsToUse}
            wordsToAvoid={form.wordsToAvoid}
            onChange={(updates) => {
              setForm((prev) => ({ ...prev, ...updates }))
              setIsDirty(true)
            }}
          />
        </CollapsibleSection>

        {/* Section: Budget & Operations */}
        <CollapsibleSection
          title="Budget & operations"
          section="operations"
          open={openSections.has('operations')}
          onToggle={() => toggleSection('operations')}
          completion={countFilledFields(form as unknown as Record<string, unknown>, SECTION_FIELDS.operations)}
        >
          <div className="space-y-4">
            <Field label="Default budget tier">
              <Select
                value={form.defaultBudgetTier}
                onValueChange={(v) => updateField('defaultBudgetTier', v as BudgetTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low budget</SelectItem>
                  <SelectItem value="moderate">Moderate budget</SelectItem>
                  <SelectItem value="premium">Premium budget</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Budget notes">
              <Textarea
                value={form.budgetNotes ?? ''}
                onChange={(e) => updateField('budgetNotes', e.target.value)}
                placeholder="Any budget constraints or notes..."
                rows={2}
              />
            </Field>

            <Field label="Preferred event days">
              <DayPicker
                selected={form.preferredEventDays}
                onChange={(days) => updateField('preferredEventDays', days)}
              />
            </Field>

            <Field label="Staff capacity">
              <Input
                value={form.staffCapacity ?? ''}
                onChange={(e) => updateField('staffCapacity', e.target.value)}
                placeholder="e.g., 2 full-time, 1 part-time"
              />
            </Field>

            <Field label="Noise restrictions">
              <Input
                value={form.noiseRestrictions ?? ''}
                onChange={(e) => updateField('noiseRestrictions', e.target.value)}
                placeholder="e.g., No outdoor events after 10 PM"
              />
            </Field>

            <Field label="Accessibility notes">
              <Textarea
                value={form.accessibilityNotes ?? ''}
                onChange={(e) => updateField('accessibilityNotes', e.target.value)}
                placeholder="Wheelchair access, hearing loop, etc."
                rows={2}
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" size="lg">
            {isEditing ? 'Save changes' : 'Create building'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/buildings')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---- Helper components ----

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function CollapsibleSection({
  title,
  section: _section,
  open,
  onToggle,
  completion,
  summary,
  required,
  children,
}: {
  title: string
  section: FormSection
  open: boolean
  onToggle: () => void
  completion: { filled: number; total: number }
  summary?: string
  required?: boolean
  children: React.ReactNode
}) {
  const allFilled = completion.filled >= completion.total && completion.total > 0

  return (
    <div className="rounded-lg border border-border-default bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{title}</span>
          {required && (
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Required</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allFilled ? (
            <Check className="h-4 w-4 text-success" />
          ) : summary ? (
            <span className="text-xs text-text-muted">{summary}</span>
          ) : completion.total > 0 ? (
            <span className="text-xs text-text-muted">
              {completion.filled}/{completion.total}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-text-muted transition-transform',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

function NearbyVenuesInput({
  venues,
  onChange,
}: {
  venues: string[]
  onChange: (venues: string[]) => void
}) {
  const [input, setInput] = useState('')

  function addVenue() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (venues.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setInput('')
      return
    }
    onChange([...venues, trimmed])
    setInput('')
  }

  function removeVenue(venue: string) {
    onChange(venues.filter((v) => v !== venue))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        <MapPin className="inline h-3 w-3 mr-1" />
        Add parks, community centres, libraries, or other local venues near your building.
        These help the AI planner suggest off-site event options and tie into local happenings.
      </p>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addVenue()
            }
          }}
          placeholder="e.g., Riley Park, Central Library"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addVenue} disabled={!input.trim()}>
          Add
        </Button>
      </div>
      {venues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {venues.map((venue) => (
            <span
              key={venue}
              className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-text-primary"
            >
              {venue}
              <button
                type="button"
                onClick={() => removeVenue(venue)}
                className="text-text-muted hover:text-danger transition-colors"
                aria-label={`Remove ${venue}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const DAY_OPTIONS = [
  { value: 'weekday_mornings', label: 'Weekday mornings' },
  { value: 'weekday_evenings', label: 'Weekday evenings' },
  { value: 'saturday', label: 'Saturdays' },
  { value: 'sunday', label: 'Sundays' },
]

function DayPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (days: string[]) => void
}) {
  function toggle(day: string) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            selected.includes(opt.value)
              ? 'bg-brand text-white border-brand'
              : 'bg-surface border-border-default text-text-secondary hover:border-brand/30',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
