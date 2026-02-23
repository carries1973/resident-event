// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 2: Preferences / Options
// ---------------------------------------------------------------------------
// Optional step where the user can refine themes, budget, event count,
// and toggles for observances and local context.
// ---------------------------------------------------------------------------

import { useState, useMemo, type Dispatch } from 'react'
import { ArrowLeft, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Building } from '@/lib/types/building'
import type { PlannerState, PlannerAction } from './usePlannerState'
import { SEASONAL_THEMES } from '@/lib/data/seasonalThemes'

interface PlannerOptionsProps {
  building: Building
  state: PlannerState
  dispatch: Dispatch<PlannerAction>
  onGenerate: () => void
}

export function PlannerOptions({
  building,
  state,
  dispatch,
  onGenerate,
}: PlannerOptionsProps) {
  // Local form state mirrors reducer state so user can edit before committing
  const [eventCount, setEventCount] = useState(state.eventCount)
  const [selectedThemes, setSelectedThemes] = useState<string[]>(state.themes)
  const [budgetOverride, setBudgetOverride] = useState(state.budgetOverride)
  const [includeObservances, setIncludeObservances] = useState(state.includeObservances)
  const [includeLocalContext, setIncludeLocalContext] = useState(state.includeLocalContext)

  // Filter seasonal themes to those relevant for the selected date range
  const relevantThemes = useMemo(() => {
    if (!state.startDate || !state.endDate) return SEASONAL_THEMES

    const startMonth = new Date(state.startDate + 'T00:00:00').getMonth() + 1
    const endMonth = new Date(state.endDate + 'T00:00:00').getMonth() + 1

    // Build a set of months in the range (handles year wrap)
    const months = new Set<number>()
    if (startMonth <= endMonth) {
      for (let m = startMonth; m <= endMonth; m++) months.add(m)
    } else {
      // Wrap around December → January
      for (let m = startMonth; m <= 12; m++) months.add(m)
      for (let m = 1; m <= endMonth; m++) months.add(m)
    }

    return SEASONAL_THEMES.filter((theme) =>
      theme.months.some((m) => months.has(m)),
    )
  }, [state.startDate, state.endDate])

  function toggleTheme(id: string) {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  function handleGenerate() {
    dispatch({
      type: 'SET_OPTIONS',
      eventCount,
      themes: selectedThemes,
      budgetOverride,
      includeObservances,
      includeLocalContext,
    })
    onGenerate()
  }

  function handleSkip() {
    onGenerate()
  }

  function handleBack() {
    dispatch({ type: 'GO_TO_STEP', step: 'intake' })
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">Step 2 of 3</span>
            <span className="text-text-secondary">Preferences</span>
          </div>
          <Progress value={66} />
        </div>

        {/* Theme preferences */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary">
            Theme Preferences
          </label>
          {relevantThemes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relevantThemes.map((theme) => {
                const isSelected = selectedThemes.includes(theme.id)
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => toggleTheme(theme.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {theme.name}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No seasonal themes match the selected date range.
            </p>
          )}
        </div>

        {/* Budget tier override */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Budget Tier
          </label>
          <Select
            value={budgetOverride || 'default'}
            onValueChange={(val) => setBudgetOverride(val === 'default' ? '' : val)}
          >
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Use building default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                Use building default ({building.defaultBudgetTier})
              </SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number of events */}
        <div className="space-y-2">
          <label
            htmlFor="planner-event-count"
            className="text-sm font-medium text-text-primary"
          >
            Number of Events
          </label>
          <Input
            id="planner-event-count"
            type="number"
            min={1}
            max={10}
            value={eventCount}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1 && val <= 10) {
                setEventCount(val)
              }
            }}
            className="w-full sm:w-[120px]"
          />
          <p className="text-xs text-text-muted">Between 1 and 10 events</p>
        </div>

        {/* Toggle: Include observances */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="planner-observances"
              className="text-sm font-medium text-text-primary"
            >
              Include observance tie-ins
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              AI will align events with holidays and observances in the period
            </p>
          </div>
          <Switch
            id="planner-observances"
            checked={includeObservances}
            onCheckedChange={setIncludeObservances}
          />
        </div>

        {/* Toggle: Include local context */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="planner-local-context"
              className="text-sm font-medium text-text-primary"
            >
              Include local context
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              AI will suggest events tied to local happenings
            </p>
          </div>
          <Switch
            id="planner-local-context"
            checked={includeLocalContext}
            onCheckedChange={setIncludeLocalContext}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full sm:w-auto gap-2"
          >
            <Zap className="h-4 w-4" />
            Skip &amp; Generate
          </Button>
          <Button
            onClick={handleGenerate}
            className="w-full sm:w-auto gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Events
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
