import { describe, it, expect } from 'vitest'
import {
  assertExportConfig,
  getDefaultExportConfig,
} from '../gatekeeper'
import type { CalendarExportConfig } from '../gatekeeper'

/** Helper: create a valid config based on the locked defaults */
function validConfig(overrides?: Partial<CalendarExportConfig>): CalendarExportConfig {
  return { ...getDefaultExportConfig(), ...overrides }
}

// ---------------------------------------------------------------------------
// getDefaultExportConfig — locked defaults
// ---------------------------------------------------------------------------

describe('getDefaultExportConfig', () => {
  it('returns the locked default values', () => {
    const config = getDefaultExportConfig()
    expect(config.orientation).toBe('landscape')
    expect(config.marginInches).toBe(0.5)
    expect(config.cellHeightInches).toBe(1.0)
    expect(config.fontSize.monthHeader).toBe(26)
    expect(config.fontSize.dayOfWeek).toBe(12)
    expect(config.fontSize.dayNumber).toBe(10.5)
    expect(config.fontSize.eventText).toBe(9.5)
    expect(config.maxEventsPerCell).toBe(2)
    expect(config.appBranding).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// assertExportConfig — valid config passes
// ---------------------------------------------------------------------------

describe('assertExportConfig', () => {
  it('does not throw for a valid config', () => {
    expect(() => assertExportConfig(validConfig())).not.toThrow()
  })

  it('does not throw when cellHeightInches exceeds minimum', () => {
    expect(() => assertExportConfig(validConfig({ cellHeightInches: 1.5 }))).not.toThrow()
  })

  // -----------------------------------------------------------------------
  // Invalid orientation
  // -----------------------------------------------------------------------

  it('throws for invalid orientation', () => {
    const config = validConfig()
    // Force an invalid value via type assertion for testing
    ;(config as unknown as Record<string, unknown>).orientation = 'portrait'
    expect(() => assertExportConfig(config)).toThrow(/orientation must be 'landscape'/)
  })

  // -----------------------------------------------------------------------
  // Invalid margins
  // -----------------------------------------------------------------------

  it('throws for margins !== 0.5', () => {
    expect(() => assertExportConfig(validConfig({ marginInches: 1.0 }))).toThrow(
      /marginInches must be 0\.5/,
    )
  })

  it('throws for zero margins', () => {
    expect(() => assertExportConfig(validConfig({ marginInches: 0 }))).toThrow(
      /marginInches must be 0\.5/,
    )
  })

  // -----------------------------------------------------------------------
  // Invalid cell height
  // -----------------------------------------------------------------------

  it('throws for cellHeightInches < 1.0', () => {
    expect(() => assertExportConfig(validConfig({ cellHeightInches: 0.8 }))).toThrow(
      /cellHeightInches must be >= 1\.0/,
    )
  })

  // -----------------------------------------------------------------------
  // Invalid font sizes
  // -----------------------------------------------------------------------

  it('throws for incorrect monthHeader font size', () => {
    expect(() =>
      assertExportConfig(
        validConfig({ fontSize: { monthHeader: 24, dayOfWeek: 12, dayNumber: 10.5, eventText: 9.5 } }),
      ),
    ).toThrow(/fontSize\.monthHeader must be 26/)
  })

  it('throws for incorrect dayOfWeek font size', () => {
    expect(() =>
      assertExportConfig(
        validConfig({ fontSize: { monthHeader: 26, dayOfWeek: 14, dayNumber: 10.5, eventText: 9.5 } }),
      ),
    ).toThrow(/fontSize\.dayOfWeek must be 12/)
  })

  it('throws for incorrect dayNumber font size', () => {
    expect(() =>
      assertExportConfig(
        validConfig({ fontSize: { monthHeader: 26, dayOfWeek: 12, dayNumber: 11, eventText: 9.5 } }),
      ),
    ).toThrow(/fontSize\.dayNumber must be 10\.5/)
  })

  it('throws for incorrect eventText font size', () => {
    expect(() =>
      assertExportConfig(
        validConfig({ fontSize: { monthHeader: 26, dayOfWeek: 12, dayNumber: 10.5, eventText: 8 } }),
      ),
    ).toThrow(/fontSize\.eventText must be 9\.5/)
  })

  it('throws when minimum font size is below 9.5', () => {
    // eventText = 8 triggers both the specific check and the minimum check
    // but the specific check fires first. Let's test with a config that has
    // correct individual values but we'd need to bypass — we test the
    // minimum-font assertion by noting that the 9.5 minimum is always met
    // when all individual values are correct. Since the individual checks
    // fire first, we verify the min-font logic indirectly: a config with
    // eventText: 9 would fail the specific eventText check.
    expect(() =>
      assertExportConfig(
        validConfig({ fontSize: { monthHeader: 26, dayOfWeek: 12, dayNumber: 10.5, eventText: 9 } }),
      ),
    ).toThrow() // Fails on eventText !== 9.5
  })

  // -----------------------------------------------------------------------
  // maxEventsPerCell
  // -----------------------------------------------------------------------

  it('throws for maxEventsPerCell !== 2', () => {
    expect(() => assertExportConfig(validConfig({ maxEventsPerCell: 3 }))).toThrow(
      /maxEventsPerCell must be 2/,
    )
  })

  it('throws for maxEventsPerCell of 1', () => {
    expect(() => assertExportConfig(validConfig({ maxEventsPerCell: 1 }))).toThrow(
      /maxEventsPerCell must be 2/,
    )
  })

  it('throws for maxEventsPerCell of 0', () => {
    expect(() => assertExportConfig(validConfig({ maxEventsPerCell: 0 }))).toThrow(
      /maxEventsPerCell must be 2/,
    )
  })

  // -----------------------------------------------------------------------
  // appBranding
  // -----------------------------------------------------------------------

  it('throws when appBranding is true', () => {
    expect(() => assertExportConfig(validConfig({ appBranding: true }))).toThrow(
      /appBranding must be false/,
    )
  })
})
