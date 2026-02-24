/**
 * Poster Template Registry
 *
 * Each template is a 1080×1400px PNG stored in /public/poster-templates/.
 * The app overlays dynamic content (logo, event name, date, location, CTA, QR)
 * at the pixel coordinates defined in each template's `zones` map.
 *
 * Safe-zone layout (all Y values are at 1080×1400 resolution):
 *   Logo zone:        top-center, Y 60–200px
 *   Event name:       Y 460–720px  (large hero text, 2 lines max)
 *   Date/time:        Y 760–880px
 *   Location:         Y 890–980px
 *   CTA text:         Y 1040–1140px
 *   QR code:          Y 1170–1310px  (right-aligned, 140×140px)
 *   Building name:    Y 1330–1370px  (footer)
 *
 * Output formats produced from each 1080×1400 base:
 *   - Instagram portrait  1080×1400px (as-is)
 *   - Facebook post       1080×1400px (as-is, Facebook supports any portrait)
 *   - Print PDF           scaled to 8.5×11" portrait (letter)
 *   - Email header        top 40% crop → 1080×560px
 *   - Instagram square    centre crop → 1080×1080px (Y 160–1240)
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
  /** Building logo (image) */
  logo: PosterTemplateZone
  /** Main event name (large hero text) */
  eventName: PosterTemplateZone
  /** Date + time string */
  dateTime: PosterTemplateZone
  /** Location / venue */
  location: PosterTemplateZone
  /** Call-to-action text */
  cta: PosterTemplateZone
  /** QR code placeholder (image) */
  qr: PosterTemplateZone
  /** Building name footer */
  buildingName: PosterTemplateZone
}

export interface PosterTemplate {
  id: string
  name: string
  category: PosterCategory
  /** Path relative to /public */
  imagePath: string
  /** Thumbnail path for the browser grid */
  thumbnailPath: string
  /** Pixel coordinates for each dynamic zone */
  zones: PosterTemplateZones
  /** Dominant overlay text colour (light or dark depending on artwork) */
  overlayScheme: 'light' | 'dark'
  /** Tags for search/filter */
  tags: string[]
  /** Short description shown in the browser */
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
  { id: 'seasonal',     label: 'Seasonal',        emoji: '🍂' },
  { id: 'social',       label: 'Social',          emoji: '🥂' },
]

/**
 * Default safe-zone layout used by all standard templates.
 * Templates that need different positioning override individual zones.
 */
const DEFAULT_ZONES: PosterTemplateZones = {
  logo: {
    x: 540,     // horizontal centre
    y: 70,
    maxWidth: 320,
    maxHeight: 130,
    align: 'center',
  },
  eventName: {
    x: 540,
    y: 480,
    maxWidth: 900,
    align: 'center',
  },
  dateTime: {
    x: 540,
    y: 770,
    maxWidth: 820,
    align: 'center',
  },
  location: {
    x: 540,
    y: 890,
    maxWidth: 820,
    align: 'center',
  },
  cta: {
    x: 540,
    y: 1060,
    maxWidth: 700,
    align: 'center',
  },
  qr: {
    x: 878,     // right zone: 878 + 140/2 = 948 → right quarter
    y: 1180,
    maxWidth: 140,
    maxHeight: 140,
  },
  buildingName: {
    x: 540,
    y: 1338,
    maxWidth: 900,
    align: 'center',
  },
}

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'movie-night',
    name: 'Movie Night',
    category: 'movie-night',
    imagePath: '/poster-templates/movie-night.png',
    thumbnailPath: '/poster-templates/thumbs/movie-night.jpg',
    zones: {
      ...DEFAULT_ZONES,
      eventName: { ...DEFAULT_ZONES.eventName, y: 500 },
    },
    overlayScheme: 'light',
    tags: ['movies', 'film', 'entertainment', 'evening', 'social'],
    description: 'Popcorn & film vibes. Perfect for rooftop or lounge screenings.',
  },
  {
    id: 'bbq-outdoor',
    name: 'BBQ & Outdoor',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/bbq.png',
    thumbnailPath: '/poster-templates/thumbs/bbq.jpg',
    zones: {
      ...DEFAULT_ZONES,
      logo: { ...DEFAULT_ZONES.logo, y: 60 },
      eventName: { ...DEFAULT_ZONES.eventName, y: 490 },
    },
    overlayScheme: 'light',
    tags: ['bbq', 'outdoor', 'summer', 'grill', 'patio', 'food'],
    description: 'Summer cookout energy. Ideal for patio, rooftop, or courtyard events.',
  },
  {
    id: 'wellness',
    name: 'Wellness & Balance',
    category: 'wellness',
    imagePath: '/poster-templates/wellness.png',
    thumbnailPath: '/poster-templates/thumbs/wellness.jpg',
    zones: {
      ...DEFAULT_ZONES,
      logo: { ...DEFAULT_ZONES.logo, y: 80 },
      eventName: { ...DEFAULT_ZONES.eventName, y: 500 },
    },
    overlayScheme: 'dark',
    tags: ['wellness', 'yoga', 'fitness', 'health', 'mindfulness', 'morning'],
    description: 'Calm and focused. Great for yoga, meditation, or fitness events.',
  },
  {
    id: 'game-night',
    name: 'Game Night',
    category: 'game-night',
    imagePath: '/poster-templates/game-night.png',
    thumbnailPath: '/poster-templates/thumbs/game-night.jpg',
    zones: {
      ...DEFAULT_ZONES,
      eventName: { ...DEFAULT_ZONES.eventName, y: 510 },
      cta: { ...DEFAULT_ZONES.cta, y: 1050 },
    },
    overlayScheme: 'light',
    tags: ['games', 'trivia', 'board games', 'social', 'evening', 'fun'],
    description: 'Bold and playful. Perfect for trivia, board game nights, or tournaments.',
  },
  {
    id: 'community',
    name: 'Community Gathering',
    category: 'community',
    imagePath: '/poster-templates/community.png',
    thumbnailPath: '/poster-templates/thumbs/community.jpg',
    zones: {
      ...DEFAULT_ZONES,
    },
    overlayScheme: 'dark',
    tags: ['community', 'meetup', 'social', 'neighbours', 'gathering', 'general'],
    description: 'Warm and welcoming. A versatile template for any community event.',
  },
]

/** Utility: find a template by ID */
export function getPosterTemplateById(id: string): PosterTemplate | undefined {
  return POSTER_TEMPLATES.find((t) => t.id === id)
}

/** Utility: filter templates by category */
export function getPosterTemplatesByCategory(category: PosterCategory): PosterTemplate[] {
  return POSTER_TEMPLATES.filter((t) => t.category === category)
}

/** Utility: search templates by tags or name */
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
