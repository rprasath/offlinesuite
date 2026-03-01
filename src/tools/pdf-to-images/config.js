/**
 * PDF to Images - Configuration
 */

export const config = {
  supportedTypes: ['application/pdf'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
}

export const formats = [
  { id: 'png', label: 'PNG', mimeType: 'image/png', quality: 1, supportsTransparency: true },
  { id: 'jpg', label: 'JPG', mimeType: 'image/jpeg', quality: 0.95, supportsTransparency: false },
  { id: 'webp', label: 'WebP', mimeType: 'image/webp', quality: 0.95, supportsTransparency: true },
]

export const scales = [
  { value: 1, label: '1x (72 DPI)', dpi: 72 },
  { value: 1.5, label: '1.5x (108 DPI)', dpi: 108 },
  { value: 2, label: '2x (144 DPI)', dpi: 144 },
  { value: 3, label: '3x (216 DPI)', dpi: 216 },
  { value: 4, label: '4x (288 DPI)', dpi: 288 },
]

export const defaultSettings = {
  format: 'png',
  scale: 2,
  quality: 0.95,
  extractAll: true,
  pageRange: '',
}
