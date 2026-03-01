/**
 * Signature Maker - Configuration
 */

export const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG (Transparent)', mimeType: 'image/png', quality: 1 },
  { id: 'jpg', label: 'JPG (White Background)', mimeType: 'image/jpeg', quality: 0.95 },
  { id: 'webp', label: 'WebP (Transparent)', mimeType: 'image/webp', quality: 0.95 },
]

export const MAX_IMAGE_SIZE = 4096 // Max width/height in pixels
export const CROP_MIN_SIZE = 50 // Minimum crop size in pixels

export const DEFAULT_SETTINGS = {
  brightness: 100,
  contrast: 100,
  threshold: 128, // For black/white conversion
  invert: false,
}
