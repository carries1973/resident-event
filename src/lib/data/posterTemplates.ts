/**
 * Poster Template Registry
 *
 * Each template is a PNG stored in /public/poster-templates/.
 * The compositor overlays a unified content panel onto the template's clear zone,
 * then renders all dynamic content (logo, event name, date, location, CTA, QR)
 * inside that panel.
 *
 * Content panel approach:
 *   - Each template defines a `contentPanel` zone (the clear/empty area in the artwork)
 *   - The compositor draws a semi-transparent panel there, then lays out text inside it
 *   - This produces clean, professional results regardless of artwork complexity
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
 * Content panel definition — the clear zone in the template artwork where
 * the compositor draws its unified panel and all text content.
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
  /** Whether to use light or dark text overlays depending on artwork darkness */
  overlayScheme: 'light' | 'dark'
  /**
   * Content panel — the clear zone where the compositor draws its unified panel.
   * When defined, the compositor uses this instead of individual backing strips.
   */
  contentPanel?: ContentPanel
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
 * Default safe-zone layout — used as a fallback when no contentPanel is defined.
 * Individual templates override specific zones as needed.
 */
const DEFAULT_ZONES: PosterTemplateZones = {
  logo: {
    x: 540,
    y: 70,
    maxWidth: 320,
    maxHeight: 100,
    align: 'center',
  },
  eventName: {
    x: 540,
    y: 220,
    maxWidth: 900,
    align: 'center',
  },
  dateTime: {
    x: 540,
    y: 460,
    maxWidth: 820,
    align: 'center',
  },
  location: {
    x: 540,
    y: 540,
    maxWidth: 820,
    align: 'center',
  },
  cta: {
    x: 540,
    y: 640,
    maxWidth: 700,
    align: 'center',
  },
  qr: {
    x: 878,
    y: 760,
    maxWidth: 140,
    maxHeight: 140,
  },
  buildingName: {
    x: 540,
    y: 940,
    maxWidth: 900,
    align: 'center',
  },
}

/**
 * All 12 templates registered with their exact filenames as dropped into
 * /public/poster-templates/ by the user.
 *
 * Content panel zones are calibrated to each template's clear area.
 * Panel Y coordinates are measured from the top of the 1400px canvas.
 */
export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'movie-night',
    name: 'Movie Night',
    category: 'movie-night',
    imagePath: '/poster-templates/Movei Night.png',
    thumbnailPath: '/poster-templates/Movei Night.png',
    // Dark grey background in upper 60%, popcorn in lower 40%
    contentPanel: {
      x: 80, y: 60, width: 920, height: 760,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 220, maxWidth: 880, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['movies', 'film', 'screening', 'entertainment', 'evening', 'popcorn'],
    description: 'Perfect for rooftop or lounge film screenings.',
  },
  {
    id: 'bbq',
    name: 'BBQ',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/BBQ.png',
    thumbnailPath: '/poster-templates/BBQ.png',
    // Cream inner panel in upper 40% has "BBQ Party" template text.
    // Use a dark solid panel to cover it and provide clean text background.
    // BBQ grill illustration (Y 480-1000) shows below the panel as a visual accent.
    contentPanel: {
      x: 80, y: 50, width: 920, height: 500,
      style: 'dark', radius: 12,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 80,  maxWidth: 240, maxHeight: 80,  align: 'center' },
      eventName:    { x: 540, y: 180, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 390, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 450, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 1100, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['bbq', 'grill', 'outdoor', 'summer', 'patio', 'food', 'cookout'],
    description: 'Summer cookout energy. Ideal for patio, rooftop, or courtyard events.',
  },
  {
    id: 'book-club',
    name: 'Book Club',
    category: 'community',
    imagePath: '/poster-templates/Book Club.png',
    thumbnailPath: '/poster-templates/Book Club.png',
    // Bookshelves at top (Y 0-220) and bottom (Y 1100-1400), clear cream middle
    contentPanel: {
      x: 80, y: 240, width: 920, height: 820,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 270, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 390, maxWidth: 880, align: 'center' },
      dateTime:     { x: 540, y: 660, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 740, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 840, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 960, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1060, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['book club', 'reading', 'learning', 'discussion', 'community', 'social'],
    description: 'Cozy and inviting. Great for book clubs and discussion groups.',
  },
  {
    id: 'cinco-de-mayo',
    name: 'Cinco de Mayo Party',
    category: 'seasonal',
    imagePath: '/poster-templates/Cinco De Mayo Party.png',
    thumbnailPath: '/poster-templates/Cinco De Mayo Party.png',
    // Dark background with maracas at sides, clear upper-centre
    contentPanel: {
      x: 80, y: 60, width: 920, height: 760,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 220, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['cinco de mayo', 'fiesta', 'party', 'seasonal', 'celebration', 'cultural'],
    description: 'Festive and vibrant. Perfect for cultural celebrations and themed parties.',
  },
  {
    id: 'coffee-event',
    name: 'Coffee Event',
    category: 'social',
    imagePath: '/poster-templates/Coffee Event.png',
    thumbnailPath: '/poster-templates/Coffee Event.png',
    // Tan/beige upper area with decorative frame, coffee photo in lower 40%
    contentPanel: {
      x: 80, y: 50, width: 920, height: 780,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 80,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 200, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['coffee', 'morning', 'social', 'meet and greet', 'neighbours', 'casual'],
    description: 'Warm and welcoming. Great for morning coffee socials and meet-and-greets.',
  },
  {
    id: 'food-truck',
    name: 'Food Truck',
    category: 'food-drink',
    imagePath: '/poster-templates/Food Truck.png',
    thumbnailPath: '/poster-templates/Food Truck.png',
    // Colourful illustration — use dark panel overlay
    contentPanel: {
      x: 80, y: 60, width: 920, height: 760,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 220, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['food truck', 'food', 'outdoor', 'vendors', 'community', 'lunch'],
    description: 'Fun and casual. Perfect for food truck pop-ups and outdoor dining events.',
  },
  {
    id: 'game-night',
    name: 'Game Night',
    category: 'game-night',
    imagePath: '/poster-templates/Game Night.png',
    thumbnailPath: '/poster-templates/Game Night.png',
    // Dark navy background, game pieces at corners and bottom
    contentPanel: {
      x: 80, y: 180, width: 920, height: 700,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 210, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 330, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 600, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 680, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 760, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['games', 'trivia', 'board games', 'social', 'evening', 'fun', 'tournament'],
    description: 'Bold and playful. Perfect for trivia, board game nights, or tournaments.',
  },
  {
    id: 'garden-club',
    name: 'Garden Club',
    category: 'family',
    imagePath: '/poster-templates/Garden Club.png',
    thumbnailPath: '/poster-templates/Garden Club.png',
    // Light beige texture throughout, garden items scattered in lower area
    contentPanel: {
      x: 80, y: 50, width: 920, height: 480,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 70,  maxWidth: 260, maxHeight: 80,  align: 'center' },
      eventName:    { x: 540, y: 170, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 380, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 450, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 1100, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['garden', 'plants', 'nature', 'outdoor', 'wellness', 'family', 'spring'],
    description: 'Fresh and natural. Ideal for gardening, plant swaps, and outdoor events.',
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    category: 'seasonal',
    imagePath: '/poster-templates/Mothers Day.png',
    thumbnailPath: '/poster-templates/Mothers Day.png',
    // Floral illustration — use light panel
    contentPanel: {
      x: 80, y: 60, width: 920, height: 760,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 220, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ["mother's day", 'mothers', 'spring', 'celebration', 'family', 'appreciation'],
    description: "Elegant and heartfelt. Perfect for Mother's Day and appreciation events.",
  },
  {
    id: 'pet-appreciation',
    name: 'Pet Appreciation',
    category: 'community',
    imagePath: '/poster-templates/Pet Appreciation.png',
    thumbnailPath: '/poster-templates/Pet Appreciation.png',
    // Dark background with pet illustrations
    contentPanel: {
      x: 80, y: 60, width: 920, height: 760,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 90,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 220, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'light',
    tags: ['pets', 'dogs', 'cats', 'community', 'fun', 'family', 'social'],
    description: 'Fun and friendly. Great for pet meetups and animal appreciation events.',
  },
  {
    id: 'pizza-party',
    name: 'Pizza Party',
    category: 'food-drink',
    imagePath: '/poster-templates/Pizza Party.png',
    thumbnailPath: '/poster-templates/Pizza Party.png',
    // White/orange border, pizza illustration at bottom (Y 850+)
    contentPanel: {
      x: 80, y: 50, width: 920, height: 780,
      style: 'transparent-dark', radius: 0,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 80,  maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 200, maxWidth: 860, align: 'center' },
      dateTime:     { x: 540, y: 500, maxWidth: 800, align: 'center' },
      location:     { x: 540, y: 580, maxWidth: 800, align: 'center' },
      cta:          { x: 540, y: 660, maxWidth: 680, align: 'center' },
      qr:           { x: 878, y: 1220, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1360, maxWidth: 900, align: 'center' },
    },
    overlayScheme: 'dark',
    tags: ['pizza', 'party', 'food', 'social', 'casual', 'fun', 'neighbours'],
    description: 'Casual and fun. Perfect for resident pizza nights and casual socials.',
  },
  {
    id: 'pool-party',
    name: 'Pool Party',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/Pool Party.png',
    thumbnailPath: '/poster-templates/Pool Party.png',
    // Full illustration (pool water + palm trees) — use white panel overlay
    contentPanel: {
      x: 100, y: 280, width: 880, height: 680,
      style: 'white', radius: 24,
    },
    zones: {
      ...DEFAULT_ZONES,
      logo:         { x: 540, y: 310, maxWidth: 280, maxHeight: 90,  align: 'center' },
      eventName:    { x: 540, y: 430, maxWidth: 820, align: 'center' },
      dateTime:     { x: 540, y: 680, maxWidth: 780, align: 'center' },
      location:     { x: 540, y: 760, maxWidth: 780, align: 'center' },
      cta:          { x: 540, y: 840, maxWidth: 660, align: 'center' },
      qr:           { x: 878, y: 960, maxWidth: 130, maxHeight: 130 },
      buildingName: { x: 540, y: 1080, maxWidth: 860, align: 'center' },
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
