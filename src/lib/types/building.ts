import type { UUID, ISODateTime, HexColour, BudgetTier, PropertyType, PrimaryUse } from './common'

export interface Building {
  id: UUID
  name: string
  address: string
  city: string
  province: string                 // Canadian province code (e.g., "AB")
  propertyType: PropertyType
  unitCount?: number
  primaryUse: PrimaryUse

  // Amenities
  amenities: string[]              // From AMENITY_OPTIONS
  customAmenities: string[]        // User-added

  // Resident Mix
  primaryResidentGroup: string     // From RESIDENT_OPTIONS
  secondaryResidentGroup?: string

  // Branding
  brandColor: HexColour            // e.g., "#2E8B8B"
  logoUrl?: string                 // Compressed data URL (≤50KB, max 200x200px)
  brandTones: string[]             // Up to 3 from TONE_OPTIONS
  wordsToUse: string[]
  wordsToAvoid: string[]

  // Budget
  defaultBudgetTier: BudgetTier
  budgetNotes?: string

  // Local Context
  nearbyVenues: string[]           // e.g., ["Riley Park", "Central Library", "Bow River Pathway"]

  // Operational
  preferredEventDays: string[]     // e.g., ["weekdays", "evenings"]
  staffCapacity?: string
  noiseRestrictions?: string
  accessibilityNotes?: string

  // Meta
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/** Creates a new building with defaults for all optional fields */
export function createDefaultBuilding(overrides: Partial<Building> & Pick<Building, 'name' | 'city' | 'province'>): Building {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    address: '',
    propertyType: 'rental_apartment',
    primaryUse: 'long_term_rental',
    amenities: [],
    customAmenities: [],
    primaryResidentGroup: '',
    brandColor: '#8F1D23',
    brandTones: [],
    wordsToUse: [],
    wordsToAvoid: [],
    defaultBudgetTier: 'moderate',
    nearbyVenues: [],
    preferredEventDays: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Ensures a building object loaded from persistence has all required array fields.
 * Older persisted buildings may be missing fields added in later schema versions.
 * This guarantees safe access to all array properties without undefined crashes.
 */
export function ensureBuildingDefaults(building: Building): Building {
  return {
    ...building,
    amenities: building.amenities ?? [],
    customAmenities: building.customAmenities ?? [],
    brandTones: building.brandTones ?? [],
    wordsToUse: building.wordsToUse ?? [],
    wordsToAvoid: building.wordsToAvoid ?? [],
    nearbyVenues: building.nearbyVenues ?? [],
    preferredEventDays: building.preferredEventDays ?? [],
    address: building.address ?? '',
    propertyType: building.propertyType ?? 'rental_apartment',
    primaryUse: building.primaryUse ?? 'long_term_rental',
    primaryResidentGroup: building.primaryResidentGroup ?? '',
    brandColor: building.brandColor ?? '#8F1D23',
    defaultBudgetTier: building.defaultBudgetTier ?? 'moderate',
  }
}
