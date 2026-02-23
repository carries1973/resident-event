/**
 * Image compression utility for building logos.
 * Resizes to max 200x200px and compresses to ≤50KB.
 */

const MAX_WIDTH = 200
const MAX_HEIGHT = 200
const MAX_SIZE_KB = 50
const INITIAL_QUALITY = 0.8
const QUALITY_STEP = 0.1
const MIN_QUALITY = 0.3

/**
 * Compress an image file to a data URL.
 * - Resizes to fit within maxWidth x maxHeight (maintaining aspect ratio)
 * - Iteratively reduces JPEG quality until under maxSizeKB
 * - Returns a base64 data URL
 */
export async function compressImage(
  file: File,
  maxWidth = MAX_WIDTH,
  maxHeight = MAX_HEIGHT,
  maxSizeKB = MAX_SIZE_KB,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = () => {
      img.onload = () => {
        // Calculate scaled dimensions
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Draw to canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until under size limit
        let quality = INITIAL_QUALITY
        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        while (getDataUrlSizeKB(dataUrl) > maxSizeKB && quality > MIN_QUALITY) {
          quality -= QUALITY_STEP
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        // If still too large at minimum quality, try PNG (for small images it might be smaller)
        if (getDataUrlSizeKB(dataUrl) > maxSizeKB) {
          const pngUrl = canvas.toDataURL('image/png')
          if (getDataUrlSizeKB(pngUrl) < getDataUrlSizeKB(dataUrl)) {
            dataUrl = pngUrl
          }
        }

        resolve(dataUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = reader.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/** Estimate the size of a data URL in KB */
export function getDataUrlSizeKB(dataUrl: string): number {
  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64 = dataUrl.split(',')[1] ?? ''
  // Base64 encodes 3 bytes per 4 characters
  const sizeBytes = (base64.length * 3) / 4
  return sizeBytes / 1024
}

/** Validate that a file is an acceptable image type */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
  return validTypes.includes(file.type)
}
