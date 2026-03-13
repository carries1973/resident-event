import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lightbulb, PlusCircle, CalendarRange } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useAppStore } from '@/lib/store/appStore'
import { generateAI } from '@/lib/ai/client'
import { parseAiResponse, aiPlannerResponseSchema, aiGeneratedEventsArraySchema } from '@/lib/ai/schemas'
import type { AiPlannerResponse } from '@/lib/ai/schemas'
import { buildEventPlannerPrompt } from '@/lib/ai/prompts/eventPlanner'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'
import { QuickIdeas } from './QuickIdeas'
import type { AiQuickIdea } from '@/lib/ai/schemas'
import { usePlannerState } from './usePlannerState'
import { PlannerIntake } from './PlannerIntake'
import { PlannerOptions } from './PlannerOptions'
import { PlannerGenerating } from './PlannerGenerating'
import { PlannerResults } from './PlannerResults'
import { PlannerError } from './PlannerError'
import { PlannerSaveFlow } from './PlannerSaveFlow'
import { ensureBuildingDefaults, type Building } from '@/lib/types/building'

export function PlannerPage() {
  const navigate = useNavigate()
  const buildings = useBuildingStore((s) => s.buildings)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const setCalendarMonth = useAppStore((s) => s.setCalendarMonth)

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    currentBuildingId ?? '',
  )
  const [mode, setMode] = useState<string>('quick')
  const [showSaveFlow, setShowSaveFlow] = useState(false)

  // Full plan wizard state
  const [planState, planDispatch] = usePlannerState(selectedBuildingId)

  // Listen for the "Try Full Plan →" banner click in QuickIdeas
  useEffect(() => {
    function handleSwitchMode(e: Event) {
      const detail = (e as CustomEvent<string>).detail
      if (detail === 'full') setMode('full')
    }
    document.addEventListener('planner:switch-mode', handleSwitchMode)
    return () => document.removeEventListener('planner:switch-mode', handleSwitchMode)
  }, [])

  // Auto-select when currentBuildingId changes or on first load
  useEffect(() => {
    if (currentBuildingId && buildings.some((b) => b.id === currentBuildingId)) {
      setSelectedBuildingId(currentBuildingId)
    } else if (buildings.length === 1) {
      setSelectedBuildingId(buildings[0].id)
    }
  }, [currentBuildingId, buildings])

  const rawBuilding: Building | undefined = buildings.find(
    (b) => b.id === selectedBuildingId,
  )
  const selectedBuilding: Building | undefined = rawBuilding
    ? ensureBuildingDefaults(rawBuilding)
    : undefined

  // ── AI Generation ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedBuilding) return

    planDispatch({ type: 'START_GENERATION' })

    try {
      // Filter observances to the selected date range
      const startMonth = parseInt(planState.startDate.slice(5, 7), 10)
      const endMonth = parseInt(planState.endDate.slice(5, 7), 10)
      const relevantObservances = DEFAULT_OBSERVANCES.filter((o) => {
        if (startMonth <= endMonth) {
          return o.month >= startMonth && o.month <= endMonth
        }
        // Wraps around year (e.g., Nov → Feb)
        return o.month >= startMonth || o.month <= endMonth
      })

      const systemPrompt = buildEventPlannerPrompt({
        building: selectedBuilding,
        startDate: planState.startDate,
        endDate: planState.endDate,
        eventCount: planState.eventCount,
        themes: planState.themes.length > 0 ? planState.themes : undefined,
        budgetTierOverride: planState.budgetOverride || undefined,
        includeObservances: planState.includeObservances,
        includeLocalContext: planState.includeLocalContext,
        observances: relevantObservances,
      })

      const result = await generateAI({
        systemPrompt,
        userMessage: `Generate ${planState.eventCount} events for ${selectedBuilding.name} from ${planState.startDate} to ${planState.endDate}.`,
        maxTokens: 5000,
      })

      // Try the new REP v3.3 wrapper format first (object with events + metadata)
      const wrapperParsed = parseAiResponse<AiPlannerResponse>(result.text, aiPlannerResponseSchema)

      if (wrapperParsed.success) {
        planDispatch({
          type: 'RECEIVE_RESULTS',
          events: wrapperParsed.data.events,
          calendarContext: wrapperParsed.data.calendarContext,
          internalNotes: wrapperParsed.data.internalNotes,
          preflightCheck: wrapperParsed.data.preflightCheck,
          preflightWarnings: wrapperParsed.data.preflightWarnings,
        })
      } else {
        // Fallback: try parsing as a plain array (legacy format)
        const arrayParsed = parseAiResponse(result.text, aiGeneratedEventsArraySchema)
        if (arrayParsed.success) {
          planDispatch({ type: 'RECEIVE_RESULTS', events: arrayParsed.data })
        } else {
          planDispatch({
            type: 'RECEIVE_ERROR',
            message: `Could not parse the AI response: ${wrapperParsed.error}`,
          })
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      planDispatch({ type: 'RECEIVE_ERROR', message })
    }
  }, [selectedBuilding, planState, planDispatch])

  // Called from PlannerIntake / PlannerOptions when user clicks "Skip & Generate"
  const handleSkipAndGenerate = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  // ── Expand Quick Idea to Full Plan ─────────────────────────────────
  const handleExpandToFullPlan = useCallback(
    (idea: AiQuickIdea) => {
      // Switch to the Full Plan tab
      setMode('full')
      // Reset planner to intake with the idea name as a pre-seeded theme
      planDispatch({ type: 'RESET' })
      planDispatch({
        type: 'SET_OPTIONS',
        eventCount: 3,
        themes: [idea.name],
        budgetOverride: '',
        includeObservances: true,
        includeLocalContext: false,
      })
    },
    [planDispatch],
  )

  // ── Save Flow ───────────────────────────────────────────────────────
  function handleSave() {
    setShowSaveFlow(true)
  }

  function handleSaveComplete() {
    // Navigate the calendar to the month of the first saved event so events
    // are immediately visible when the user visits the calendar.
    const firstEventDate = planState.generatedEvents[0]?.date
    if (firstEventDate && firstEventDate.length >= 7) {
      const eventYear = parseInt(firstEventDate.slice(0, 4), 10)
      const eventMonth = parseInt(firstEventDate.slice(5, 7), 10)
      if (!isNaN(eventYear) && !isNaN(eventMonth)) {
        setCalendarMonth(eventYear, eventMonth)
      }
    }

    setShowSaveFlow(false)
    planDispatch({ type: 'RESET' })
    navigate('/calendar')
  }

  // ── Render Full Plan Wizard Step ───────────────────────────────────
  function renderFullPlanStep() {
    if (!selectedBuilding) return null

    if (showSaveFlow) {
      const selected = planState.selectedIds.map((i) => planState.generatedEvents[i])
      return (
        <PlannerSaveFlow
          events={selected}
          building={selectedBuilding}
          onComplete={handleSaveComplete}
        />
      )
    }

    switch (planState.step) {
      case 'intake':
        return (
          <PlannerIntake
            building={selectedBuilding}
            state={planState}
            dispatch={planDispatch}
            onSkipToGenerate={handleSkipAndGenerate}
          />
        )
      case 'options':
        return (
          <PlannerOptions
            building={selectedBuilding}
            state={planState}
            dispatch={planDispatch}
            onGenerate={handleGenerate}
          />
        )
      case 'generating':
        return (
          <PlannerGenerating
            onCancel={() => planDispatch({ type: 'GO_TO_STEP', step: 'intake' })}
          />
        )
      case 'results':
        return (
          <PlannerResults
            state={planState}
            dispatch={planDispatch}
            building={selectedBuilding}
            onSave={handleSave}
            onRegenerateAll={handleGenerate}
          />
        )
      case 'error':
        return (
          <PlannerError
            state={planState}
            dispatch={planDispatch}
            onRetry={handleGenerate}
          />
        )
      default:
        return null
    }
  }

  // No buildings — show nudge
  if (buildings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Event Planner</h1>
          <p className="text-text-secondary text-sm mt-1">
            Generate AI-powered event ideas for your building.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Add a building first to start planning
          </h2>
          <p className="text-text-secondary text-sm mb-4 max-w-md">
            Before generating event ideas, you need to set up at least one building
            with its details and amenities.
          </p>
          <Link
            to="/buildings/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Your First Building
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Event Planner</h1>
        <p className="text-text-secondary text-sm mt-1">
          Generate AI-powered event ideas for your building.
        </p>
      </div>

      {/* Building selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-primary" htmlFor="building-select">
          Building
        </label>
        <Select
          value={selectedBuildingId}
          onValueChange={setSelectedBuildingId}
        >
          <SelectTrigger className="w-full sm:w-[280px]" id="building-select">
            <SelectValue placeholder="Select a building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: b.brandColor }}
                  />
                  {b.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode toggle + content */}
      {selectedBuilding ? (
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="h-10 gap-1 bg-surface border border-border-default p-1">
            <TabsTrigger
              value="quick"
              className="data-[state=active]:!bg-accent-primary data-[state=active]:!text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <Lightbulb className="h-4 w-4" />
              Quick Ideas
            </TabsTrigger>
            <TabsTrigger
              value="full"
              className="data-[state=active]:!bg-accent-primary data-[state=active]:!text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <CalendarRange className="h-4 w-4" />
              Full Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickIdeas
              building={selectedBuilding}
              onExpandToFullPlan={handleExpandToFullPlan}
              personaOverride={selectedBuilding.primaryResidentGroup || undefined}
            />
          </TabsContent>

          <TabsContent value="full">
            {renderFullPlanStep()}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-text-muted text-sm">
            Select a building above to start planning events.
          </p>
        </div>
      )}
    </div>
  )
}
