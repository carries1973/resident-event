/**
 * Calendar Export Gatekeeper
 *
 * Enforces the LOCKED calendar export specification. Every assertion in
 * this module corresponds to a constraint in the export contract. These
 * checks run before every PDF export — if any fail, the export is aborted
 * with a descriptive error so the developer can correct the violation.
 */

export interface CalendarExportConfig {
  orientation: 'landscape'
  marginInches: number // must be 0.5
  cellHeightInches: number // must be >= 1.0
  fontSize: {
    monthHeader: number // must be 26
    dayOfWeek: number // must be 12
    dayNumber: number // must be 10.5
    eventText: number // must be 9.5
  }
  maxEventsPerCell: number // must be 2
  appBranding: boolean // must be false
}

/**
 * Validate every locked constraint in the calendar export config.
 *
 * Throws an `Error` with a specific message on the first failing assertion.
 * This means the export will not proceed unless every value matches the
 * locked specification exactly.
 */
export function assertExportConfig(config: CalendarExportConfig): void {
  if (config.orientation !== 'landscape') {
    throw new Error(
      `Gatekeeper: orientation must be 'landscape', got '${config.orientation}'`,
    )
  }

  if (config.marginInches !== 0.5) {
    throw new Error(
      `Gatekeeper: marginInches must be 0.5, got ${config.marginInches}`,
    )
  }

  if (config.cellHeightInches < 1.0) {
    throw new Error(
      `Gatekeeper: cellHeightInches must be >= 1.0, got ${config.cellHeightInches}`,
    )
  }

  if (config.fontSize.monthHeader !== 26) {
    throw new Error(
      `Gatekeeper: fontSize.monthHeader must be 26, got ${config.fontSize.monthHeader}`,
    )
  }

  if (config.fontSize.dayOfWeek !== 12) {
    throw new Error(
      `Gatekeeper: fontSize.dayOfWeek must be 12, got ${config.fontSize.dayOfWeek}`,
    )
  }

  if (config.fontSize.dayNumber !== 10.5) {
    throw new Error(
      `Gatekeeper: fontSize.dayNumber must be 10.5, got ${config.fontSize.dayNumber}`,
    )
  }

  if (config.fontSize.eventText !== 9.5) {
    throw new Error(
      `Gatekeeper: fontSize.eventText must be 9.5, got ${config.fontSize.eventText}`,
    )
  }

  // Enforce minimum font size across all text elements
  const allFontSizes = Object.values(config.fontSize)
  const minFont = Math.min(...allFontSizes)
  if (minFont < 9.5) {
    throw new Error(
      `Gatekeeper: minimum font size must be >= 9.5, got ${minFont}`,
    )
  }

  if (config.maxEventsPerCell !== 2) {
    throw new Error(
      `Gatekeeper: maxEventsPerCell must be 2, got ${config.maxEventsPerCell}`,
    )
  }

  if (config.appBranding !== false) {
    throw new Error(
      `Gatekeeper: appBranding must be false, got ${config.appBranding}`,
    )
  }
}

/**
 * Return the locked default config values for calendar PDF export.
 *
 * These values are the single source of truth for the export contract.
 * They must not be modified without explicit authorisation.
 */
export function getDefaultExportConfig(): CalendarExportConfig {
  return {
    orientation: 'landscape',
    marginInches: 0.5,
    cellHeightInches: 1.0,
    fontSize: {
      monthHeader: 26,
      dayOfWeek: 12,
      dayNumber: 10.5,
      eventText: 9.5,
    },
    maxEventsPerCell: 2,
    appBranding: false,
  }
}
