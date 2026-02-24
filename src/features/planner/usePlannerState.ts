// ---------------------------------------------------------------------------
// Full Plan Wizard — State Management
// ---------------------------------------------------------------------------
// useReducer-based hook that manages all wizard state for the Full Plan mode.
// Aligned to REP v3.3: stores calendar context, internal notes, and preflight
// check metadata alongside the generated events.
// ---------------------------------------------------------------------------

import { useReducer } from 'react'
import type { AiGeneratedEvent, AiCalendarContext, AiInternalNotes, AiPreflightCheck } from '@/lib/ai/schemas'

export type PlannerStep = 'intake' | 'options' | 'generating' | 'results' | 'error'

export interface PlannerState {
  step: PlannerStep
  // Intake
  buildingId: string
  startDate: string         // YYYY-MM-DD
  endDate: string           // YYYY-MM-DD
  personaOverride: string   // '' means use building's primaryResidentGroup
  // Options
  eventCount: number    // 1-10, default 3
  themes: string[]      // selected theme IDs
  budgetOverride: string // '' means use building default
  includeObservances: boolean  // default true
  includeLocalContext: boolean // default false
  // Results
  generatedEvents: AiGeneratedEvent[]
  selectedIds: number[]  // indices of accepted events
  // REP v3.3 metadata
  calendarContext?: AiCalendarContext
  internalNotes?: AiInternalNotes
  preflightCheck?: AiPreflightCheck
  preflightWarnings?: string[]
  // Error
  errorMessage: string
  errorCount: number
}

export type PlannerAction =
  | { type: 'SET_INTAKE'; buildingId: string; startDate: string; endDate: string }
  | { type: 'SET_DATES'; startDate: string; endDate: string }
  | { type: 'SET_PERSONA'; personaOverride: string }
  | { type: 'SET_OPTIONS'; eventCount: number; themes: string[]; budgetOverride: string; includeObservances: boolean; includeLocalContext: boolean }
  | { type: 'START_GENERATION' }
  | {
      type: 'RECEIVE_RESULTS'
      events: AiGeneratedEvent[]
      calendarContext?: AiCalendarContext
      internalNotes?: AiInternalNotes
      preflightCheck?: AiPreflightCheck
      preflightWarnings?: string[]
    }
  | { type: 'RECEIVE_ERROR'; message: string }
  | { type: 'ACCEPT_EVENT'; index: number }
  | { type: 'REJECT_EVENT'; index: number }
  | { type: 'UPDATE_EVENT'; index: number; updates: Partial<AiGeneratedEvent> }
  | { type: 'GO_TO_STEP'; step: PlannerStep }
  | { type: 'RESET' }

function createInitialState(buildingId: string): PlannerState {
  return {
    step: 'intake',
    buildingId,
    startDate: '',
    endDate: '',
    personaOverride: '',
    eventCount: 3,
    themes: [],
    budgetOverride: '',
    includeObservances: true,
    includeLocalContext: false,
    generatedEvents: [],
    selectedIds: [],
    errorMessage: '',
    errorCount: 0,
  }
}

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'SET_INTAKE':
      return {
        ...state,
        buildingId: action.buildingId,
        startDate: action.startDate,
        endDate: action.endDate,
        step: 'options',
      }

    case 'SET_DATES':
      return {
        ...state,
        startDate: action.startDate,
        endDate: action.endDate,
      }

    case 'SET_PERSONA':
      return {
        ...state,
        personaOverride: action.personaOverride,
      }

    case 'SET_OPTIONS':
      return {
        ...state,
        eventCount: action.eventCount,
        themes: action.themes,
        budgetOverride: action.budgetOverride,
        includeObservances: action.includeObservances,
        includeLocalContext: action.includeLocalContext,
      }

    case 'START_GENERATION':
      return {
        ...state,
        step: 'generating',
        generatedEvents: [],
        selectedIds: [],
        calendarContext: undefined,
        internalNotes: undefined,
        preflightCheck: undefined,
        preflightWarnings: undefined,
        errorMessage: '',
      }

    case 'RECEIVE_RESULTS':
      return {
        ...state,
        step: 'results',
        generatedEvents: action.events,
        // Auto-select all events by default
        selectedIds: action.events.map((_, i) => i),
        // REP v3.3 metadata
        calendarContext: action.calendarContext,
        internalNotes: action.internalNotes,
        preflightCheck: action.preflightCheck,
        preflightWarnings: action.preflightWarnings,
      }

    case 'RECEIVE_ERROR':
      return {
        ...state,
        step: 'error',
        errorMessage: action.message,
        errorCount: state.errorCount + 1,
      }

    case 'ACCEPT_EVENT': {
      const alreadySelected = state.selectedIds.includes(action.index)
      return {
        ...state,
        selectedIds: alreadySelected
          ? state.selectedIds.filter((id) => id !== action.index)
          : [...state.selectedIds, action.index],
      }
    }

    case 'REJECT_EVENT': {
      // Remove from generatedEvents and adjust selectedIds
      const newEvents = state.generatedEvents.filter((_, i) => i !== action.index)
      const newSelectedIds = state.selectedIds
        .filter((id) => id !== action.index)
        .map((id) => (id > action.index ? id - 1 : id))
      return {
        ...state,
        generatedEvents: newEvents,
        selectedIds: newSelectedIds,
      }
    }

    case 'UPDATE_EVENT':
      return {
        ...state,
        generatedEvents: state.generatedEvents.map((event, i) =>
          i === action.index ? { ...event, ...action.updates } : event,
        ),
      }

    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.step,
      }

    case 'RESET':
      return createInitialState(state.buildingId)

    default:
      return state
  }
}

/**
 * Custom hook for the Full Plan wizard state.
 *
 * Returns `[state, dispatch]` — the state tracks the current wizard step,
 * intake/option values, generated events, REP v3.3 metadata, and error information.
 */
export function usePlannerState(initialBuildingId?: string) {
  return useReducer(plannerReducer, initialBuildingId ?? '', createInitialState)
}
