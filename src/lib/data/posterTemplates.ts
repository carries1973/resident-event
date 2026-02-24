/**
 * Poster Template Registry
 *
 * Each template is a PNG stored in /public/poster-templates/.
 * The app overlays dynamic content (logo, event name, date, location, CTA, QR)
 * at the pixel coordinates defined in each template's `zones` map.
 *
 * Safe-zone layout (all Y values at 1080×1400 resolution):
 *   Logo zone:        top-center, Y 60–200px
 *   Event name:       Y 460–720px  (large hero text, 2 lines max)
 *   Date/time:        Y 760–880px
 *   Location:         Y 890–980px
 *   CTA text:         Y 1040–1140px
 *   QR code:          Y 1170–1310px  (right quarter, 140×140px)
 *   Building name:    Y 1330–1370px  (footer)
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
 * Default safe-zone layout shared across all templates.
 * Individual templates can override specific zones as needed.
 */
const DEFAULT_ZONES: PosterTemplateZones = {
  logo: {
    x: 540,
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
    x: 878,
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

/**
 * All 12 templates registered with their exact filenames as dropped into
 * /public/poster-templates/ by the user.
 */
export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'movie-night',
    name: 'Movie Night',
    category: 'movie-night',
    imagePath: '/poster-templates/Movei Night.png',
    thumbnailPath: '/poster-templates/Movei Night.png',
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES, eventName: { ...DEFAULT_ZONES.eventName, y: 510 } },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
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
    zones: { ...DEFAULT_ZONES },
    overlayScheme: 'light',
    tags: ['pizza', 'party', 'food', 'social', 'casual', 'fun', 'neighbours'],
    description: 'Casual and fun. Perfect for resident pizza nights and casual socials.',
  },
  {
    id: 'pool-party',
    name: 'Pool Party',
    category: 'bbq-outdoor',
    imagePath: '/poster-templates/Pool Party.png',
    thumbnailPath: '/poster-templates/Pool Party.png',
    zones: { ...DEFAULT_ZONES },
    overlayScheme: 'light',
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
