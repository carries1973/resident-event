export const TONE_OPTIONS = [
  'Warm & Welcoming',
  'Professional & Polished',
  'Fun & Energetic',
  'Calm & Serene',
  'Modern & Trendy',
  'Community-Focused',
  'Eco-Friendly',
  'Family-Friendly',
  'Upscale & Refined',
  'Casual & Approachable',
] as const

export type BrandTone = typeof TONE_OPTIONS[number]
