/**
 * Colour utilities for building branding
 */

/** Convert hex colour to RGB tuple */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return [r, g, b]
}

/** Calculate relative luminance of a colour */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Get WCAG contrast ratio between two hex colours */
export function getContrastRatio(fg: string, bg: string): number {
  const [r1, g1, b1] = hexToRgb(fg)
  const [r2, g2, b2] = hexToRgb(bg)
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Determine whether to use white or dark text on a given background colour */
export function getTextColourForBackground(bg: string): '#FFFFFF' | '#1A1D2E' {
  const [r, g, b] = hexToRgb(bg)
  const luminance = relativeLuminance(r, g, b)
  return luminance > 0.179 ? '#1A1D2E' : '#FFFFFF'
}

/** Check if a string is a valid hex colour */
export function isValidHexColour(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

/** Lighten a hex colour by a percentage (0-100) */
export function lightenColour(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex)
  const amount = Math.round(255 * (percent / 100))
  const nr = Math.min(255, r + amount)
  const ng = Math.min(255, g + amount)
  const nb = Math.min(255, b + amount)
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}
