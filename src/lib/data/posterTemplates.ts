/**
 * Poster Template Registry
 *
 * Each template is a PNG stored in /public/poster-templates/.
 * The compositor overlays dynamic event content onto each template's clear zone.
 *
 * Design philosophy:
 *   - Each template has a clearly identified "text zone" — an area of the artwork
 *     that is either empty, solid-coloured, or lightly textured enough to support text
 *   - The compositor places all content (logo, event name, date, location, CTA, QR,
 *     building name) within that zone
 *   - For templates with busy backgrounds in the text zone, a contentPanel is defined
 *     to draw a clean panel before rendering text
 *   - overlayScheme 'light' = white text (for dark backgrounds)
 *   - overlayScheme 'dark'  = dark text (for light/white backgrounds)
 *
 * Output formats from each 1080×1400 base:
 *   - Instagram portrait  1080×1400px (as-is)
 *   - Facebook post       1080×1400px (as-is)
 *   - Print PDF           scaled to 8.5×11" portrait (letter)
 *   - Email header        top 40% crop → 1080×560px
 *   - Instagram square    centre crop → 1080×1080px
 */

export interface PosterTemplateZone {
  /** X centre of the text block in pixels (1080px wide canvas) */
  x: number
  /** Y top of the text/image block in pixels (1400px tall canvas) */
  y: number
  /** Maximum width of the content block in pixels */
  maxWidth: number
  /** Maximum height of the content block in pixels (for image zones) */
  maxHeight?: number
  /** Text alignment for text zones */
  align?: 'left' | 'center' | 'right'
}

export interface PosterTemplateZones {
  logo: PosterTemplateZone
  eventName: PosterTemplateZone
  dateTime: PosterTemplateZone
  location: PosterTemplateZone
  cta: PosterTemplateZone
  qr: PosterTemplateZone
  buildingName: PosterTemplateZone
}

/**
 * Content panel definition — drawn over the template artwork before text is rendered.
 * Only needed when the template's text zone has a busy background that needs covering.
 */
export interface ContentPanel {
  /** X left edge of the panel */
  x: number
  /** Y top edge of the panel */
  y: number
  /** Panel width */
  width: number
  /** Panel height */
  height: number
  /** Panel background style */
  style: 'white' | 'dark' | 'transparent-light' | 'transparent-dark'
  /** Corner radius */
  radius?: number
}

export interface PosterTemplate {
  id: string
  name: string
  category: PosterCategory
  /** Path relative to /public — matches the exact filename the user dropped in */
  imagePath: string
  /** Thumbnail shown in the browse grid (same PNG — browser scales it down) */
  thumbnailPath: string
  zones: PosterTemplateZones
  /** Whether to use light or dark text overlays depending on artwork background */
  overlayScheme: 'light' | 'dark'
  /**
   * Content panel — only defined when the text zone needs a panel drawn over it.
   * When undefined, text renders directly on the template background.
   */
  contentPanel?: ContentPanel
  /**
   * Optional font scale multiplier (0.5–1.0) for templates with compact text zones.
   * Defaults to 1.0 (full size). Use 0.65 for very compact zones like BBQ bottom strip.
   */
  fontScale?: number
  tags: string[]
  description: string
}

export type PosterCategory =
  | 'movie-night'
  | 'bbq-outdoor'
  | 'wellness'
  | 'game-night'
  | 'community'
  | 'seasonal'
  | 'social'
  | 'food-drink'
  | 'family'

export interface PosterCategoryMeta {
  id: PosterCategory
  label: string
  emoji: string
}

export const POSTER_CATEGORIES: PosterCategoryMeta[] = [
  { id: 'movie-night',  label: 'Movie Night',    emoji: '🎬' },
  { id: 'bbq-outdoor',  label: 'BBQ & Outdoor',  emoji: '🔥' },
  { id: 'wellness',     label: 'Wellness',        emoji: '🧘' },
  { id: 'game-night',   label: 'Game Night',      emoji: '🎮' },
  { id: 'community',    label: 'Community',       emoji: '🏠' },
  { id: 'seasonal',     label: 'Seasonal',        emoji: '🌸' },
  { id: 'social',       label: 'Social',          emoji: '🥂' },
  { id: 'food-drink',   label: 'Food & Drink',    emoji: '🍕' },
  { id: 'family',       label: 'Family',          emoji: '🌿' },
]

/**
 * All 12 templates registered with their exact filenames as dropped into
 * /public/poster-templates/ by the user.
 *
 * Zone coordinates are calibrated to each template's actual clear area.
 * Canvas is 1080×1400px.
 *
 * Layout conventions:
 *   - logo:         Top of the text zone, centred
 *   - eventName:    Below logo, large hero text
 *   - dateTime:     Below event name
 *   - location:     Below date/time
 *   - cta:          CTA pill button
 *   - qr:           QR code placeholder (bottom-right of text zone)
 *   - buildingName: Footer text at bottom of text zone
 */
export const POSTER_TEMPLATES: PosterTemplate[] = [

  // ─────────────────────────────────────────────────────────────────
  // MOVIE NIGHT
  // Dark charcoal/grey upper 65%, popcorn illustration lower 35%
  // Text zone: upper dark area Y 60–860
  // White text on dark background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'movie-night',
    name: 'Movie Night',
    category: 'movie-night',
    imagePath: '/poster-templates/Movei Night.png',
    thumbnailPath: '/poster-templates/Movei Night.png',
    zones: {
      logo:         { x: 540, y: 65,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 185, maxWidth: 880, align: 'center' },
      dateTime:     { x: 540, y: 490, maxWidth: 680, align: 'center' },
      location:     { x: 540, y: 555, maxWidth: 680, align: 'center' },
      cta:          { x: 540, y: 620, maxWidth: 680, align: 'center' },
      qr:           { x: 940, y: 490, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 730, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['movies', 'film', 'screening', 'entertainment', 'evening', 'popcorn'],
    description: 'Perfect for rooftop or lounge film screenings.',
  },

  // ─────────────────────────────────────────────────────────────────
  // BBQ
  // Teal outer border, cream inner with "BBQ Party" text (Y 100-500),
  // BBQ grill illustration (Y 500-1000), clean teal bottom (Y 1000-1400)
  // Text zone: bottom teal area Y 1010–1380
  // White text on teal background — no panel needed (teal is dark enough)
  // fontScale 0.65 to fit event name + details in the compact 370px zone
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'bbq',
    name: 'BBQ',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/BBQ.png',
    thumbnailPath: '/poster-templates/BBQ.png',
    fontScale: 0.65,
    zones: {
      logo:         { x: 540, y: 1010, maxWidth: 120, maxHeight: 45,  align: 'center' },
      eventName:    { x: 540, y: 1065, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 1200, maxWidth: 760, align: 'center' },
      location:     { x: 540, y: 1240, maxWidth: 760, align: 'center' },
      cta:          { x: 540, y: 1278, maxWidth: 500, align: 'center' },
      qr:           { x: 940, y: 1010, maxWidth: 95,  maxHeight: 95  },
      buildingName: { x: 540, y: 1358, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['bbq', 'grill', 'outdoor', 'summer', 'patio', 'food', 'cookout'],
    description: 'Summer cookout energy. Ideal for patio, rooftop, or courtyard events.',
  },

  // ─────────────────────────────────────────────────────────────────
  // BOOK CLUB
  // Colourful bookshelf at top (Y 0-200) and bottom (Y 1100-1400)
  // Clean cream/white centre area (Y 200-1100) — COMPLETELY CLEAR
  // Text zone: centre white area Y 220–1080
  // Dark text on white background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'book-club',
    name: 'Book Club',
    category: 'community',
    imagePath: '/poster-templates/Book Club.png',
    thumbnailPath: '/poster-templates/Book Club.png',
    zones: {
      logo:         { x: 540, y: 240, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 360, maxWidth: 880, align: 'center' },
      dateTime:     { x: 540, y: 660, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 730, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 820, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 930, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1050, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['book club', 'reading', 'learning', 'discussion', 'community', 'social'],
    description: 'Cozy and inviting. Great for book clubs and discussion groups.',
  },

  // ─────────────────────────────────────────────────────────────────
  // CINCO DE MAYO
  // Dark background with maracas at sides, clear upper-centre
  // Text zone: upper dark area Y 60–820
  // White text on dark background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'cinco-de-mayo',
    name: 'Cinco de Mayo Party',
    category: 'seasonal',
    imagePath: '/poster-templates/Cinco De Mayo Party.png',
    thumbnailPath: '/poster-templates/Cinco De Mayo Party.png',
    zones: {
      logo:         { x: 540, y: 80,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 200, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 510, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 590, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 670, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 760, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 830, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['cinco de mayo', 'fiesta', 'party', 'seasonal', 'celebration', 'cultural'],
    description: 'Festive and vibrant. Perfect for cultural celebrations and themed parties.',
  },

  // ─────────────────────────────────────────────────────────────────
  // COFFEE EVENT
  // Beige/tan upper area (Y 0-830) with decorative frame + coffee cup icon
  // Coffee photo at bottom (Y 830-1400)
  // Text zone: upper beige area Y 60–800
  // Dark text on beige background — no panel needed (beige is light enough)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'coffee-event',
    name: 'Coffee Event',
    category: 'social',
    imagePath: '/poster-templates/Coffee Event.png',
    thumbnailPath: '/poster-templates/Coffee Event.png',
    zones: {
      logo:         { x: 540, y: 80,  maxWidth: 260, maxHeight: 80,  align: 'center' },
      eventName:    { x: 540, y: 190, maxWidth: 820, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 780, align: 'center' },
      location:     { x: 540, y: 570, maxWidth: 780, align: 'center' },
      cta:          { x: 540, y: 650, maxWidth: 660, align: 'center' },
      qr:           { x: 878, y: 730, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 780, maxWidth: 860, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['coffee', 'morning', 'social', 'meet and greet', 'neighbours', 'casual'],
    description: 'Warm and welcoming. Great for morning coffee socials and meet-and-greets.',
  },

  // ─────────────────────────────────────────────────────────────────
  // FOOD TRUCK
  // Red background (full), food truck illustration in centre (Y 580-1000)
  // Upper red area (Y 0-580) and lower red area (Y 1000-1400) are clear
  // Text zone: upper red area Y 60–560
  // White text on red background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'food-truck',
    name: 'Food Truck',
    category: 'food-drink',
    imagePath: '/poster-templates/Food Truck.png',
    thumbnailPath: '/poster-templates/Food Truck.png',
    zones: {
      logo:         { x: 540, y: 80,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 190, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 390, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 460, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 530, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['food truck', 'food', 'outdoor', 'vendors', 'community', 'lunch'],
    description: 'Fun and casual. Perfect for food truck pop-ups and outdoor dining events.',
  },

  // ─────────────────────────────────────────────────────────────────
  // GAME NIGHT
  // Dark navy background, game pieces at corners and bottom
  // Text zone: upper dark area Y 180–880
  // White text on dark background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'game-night',
    name: 'Game Night',
    category: 'game-night',
    imagePath: '/poster-templates/Game Night.png',
    thumbnailPath: '/poster-templates/Game Night.png',
    zones: {
      logo:         { x: 540, y: 200, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 320, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 610, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 690, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 770, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['games', 'trivia', 'board games', 'social', 'evening', 'fun', 'tournament'],
    description: 'Bold and playful. Perfect for trivia, board game nights, or tournaments.',
  },

  // ─────────────────────────────────────────────────────────────────
  // GARDEN CLUB
  // Beige texture throughout, garden items scattered (basket left Y 300-700,
  // plant pot right Y 200-600, trowel bottom-left Y 900-1200, seed tray
  // bottom-centre Y 900-1200, tap bottom-right Y 800-1200)
  // Upper area (Y 0-250) is relatively clear
  // Text zone: upper area Y 50-480 — needs white panel to cover texture
  // Dark text on white panel
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'garden-club',
    name: 'Garden Club',
    category: 'family',
    imagePath: '/poster-templates/Garden Club.png',
    thumbnailPath: '/poster-templates/Garden Club.png',
    contentPanel: {
      x: 90, y: 50, width: 900, height: 820,
      style: 'white', radius: 16,
    },
    zones: {
      logo:         { x: 540, y: 80,  maxWidth: 260, maxHeight: 80,  align: 'center' },
      eventName:    { x: 540, y: 190, maxWidth: 840, align: 'center' },
      dateTime:     { x: 540, y: 490, maxWidth: 780, align: 'center' },
      location:     { x: 540, y: 560, maxWidth: 780, align: 'center' },
      cta:          { x: 540, y: 640, maxWidth: 660, align: 'center' },
      qr:           { x: 878, y: 730, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 820, maxWidth: 860, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['garden', 'plants', 'nature', 'outdoor', 'wellness', 'family', 'spring'],
    description: 'Fresh and natural. Ideal for gardening, plant swaps, and outdoor events.',
  },

  // ─────────────────────────────────────────────────────────────────
  // MOTHER'S DAY
  // Dark rose/red border (full), white centre area (Y 150-960), floral
  // decorations at corners and bottom
  // Text zone: white centre area Y 160–940
  // Dark text on white background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'mothers-day',
    name: "Mother's Day",
    category: 'seasonal',
    imagePath: '/poster-templates/Mothers Day.png',
    thumbnailPath: '/poster-templates/Mothers Day.png',
    zones: {
      logo:         { x: 540, y: 180, maxWidth: 260, maxHeight: 80,  align: 'center' },
      eventName:    { x: 540, y: 290, maxWidth: 820, align: 'center' },
      dateTime:     { x: 540, y: 590, maxWidth: 780, align: 'center' },
      location:     { x: 540, y: 660, maxWidth: 780, align: 'center' },
      cta:          { x: 540, y: 740, maxWidth: 660, align: 'center' },
      qr:           { x: 878, y: 830, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 910, maxWidth: 860, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ["mother's day", 'mothers', 'spring', 'celebration', 'family', 'appreciation'],
    description: "Elegant and heartfelt. Perfect for Mother's Day and appreciation events.",
  },

  // ─────────────────────────────────────────────────────────────────
  // PET APPRECIATION
  // Dark background with pet illustrations scattered throughout
  // Upper centre area is relatively clear
  // Text zone: upper dark area Y 60–820
  // White text on dark background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'pet-appreciation',
    name: 'Pet Appreciation',
    category: 'community',
    imagePath: '/poster-templates/Pet Appreciation.png',
    thumbnailPath: '/poster-templates/Pet Appreciation.png',
    zones: {
      logo:         { x: 540, y: 80,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 200, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 510, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 590, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 670, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 760, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 830, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['pets', 'dogs', 'cats', 'community', 'fun', 'family', 'social'],
    description: 'Fun and friendly. Great for pet meetups and animal appreciation events.',
  },

  // ─────────────────────────────────────────────────────────────────
  // PIZZA PARTY
  // Orange outer border, white inner area (Y 50-850) — COMPLETELY CLEAR
  // Pizza illustration at bottom (Y 850-1400)
  // Text zone: white upper area Y 70–820
  // Dark text on white background — no panel needed
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'pizza-party',
    name: 'Pizza Party',
    category: 'food-drink',
    imagePath: '/poster-templates/Pizza Party.png',
    thumbnailPath: '/poster-templates/Pizza Party.png',
    zones: {
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 210, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 510, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 750, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 810, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['pizza', 'party', 'food', 'social', 'casual', 'fun', 'neighbours'],
    description: 'Casual and fun. Perfect for resident pizza nights and casual socials.',
  },

  // ─────────────────────────────────────────────────────────────────
  // POOL PARTY
  // Full illustration (pool water + palm trees)
  // Text zone: centre white panel Y 280–960
  // Dark text on white panel
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'pool-party',
    name: 'Pool Party',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/Pool Party.png',
    thumbnailPath: '/poster-templates/Pool Party.png',
    contentPanel: {
      x: 100, y: 280, width: 880, height: 680,
      style: 'white', radius: 24,
    },
    zones: {
      logo:         { x: 540, y: 310, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 430, maxWidth: 820, align: 'center' },
      dateTime:     { x: 540, y: 680, maxWidth: 780, align: 'center' },
      location:     { x: 540, y: 750, maxWidth: 780, align: 'center' },
      cta:          { x: 540, y: 830, maxWidth: 660, align: 'center' },
      qr:           { x: 878, y: 920, maxWidth: 120, maxHeight: 120 },
      buildingName: { x: 540, y: 1040, maxWidth: 860, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['pool', 'summer', 'outdoor', 'party', 'swimming', 'social', 'hot weather'],
    description: 'Cool and vibrant. Ideal for summer pool parties and outdoor water events.',
  },
]

/** Find a template by ID */
export function getPosterTemplateById(id: string): PosterTemplate | undefined {
  return POSTER_TEMPLATES.find((t) => t.id === id)
}

/** Filter templates by category */
export function getPosterTemplatesByCategory(category: PosterCategory): PosterTemplate[] {
  return POSTER_TEMPLATES.filter((t) => t.category === category)
}

/** Search templates by name, description, or tags */
export function searchPosterTemplates(query: string): PosterTemplate[] {
  const q = query.toLowerCase().trim()
  if (!q) return POSTER_TEMPLATES
  return POSTER_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)),
  )
}
