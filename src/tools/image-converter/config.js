/**
 * Image Format Converter - Configuration
 */

export const config = {
  supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 20,
}

export const formats = [
  { 
    id: 'png', 
    label: 'PNG', 
    mimeType: 'image/png', 
    quality: 1,
    supportsTransparency: true,
    description: 'Lossless, supports transparency',
  },
  { 
    id: 'jpg', 
    label: 'JPG', 
    mimeType: 'image/jpeg', 
    quality: 0.95,
    supportsTransparency: false,
    description: 'Compressed, smaller file size',
  },
  { 
    id: 'webp', 
    label: 'WebP', 
    mimeType: 'image/webp', 
    quality: 0.95,
    supportsTransparency: true,
    description: 'Modern format, best compression',
  },
  { 
    id: 'bmp', 
    label: 'BMP', 
    mimeType: 'image/bmp', 
    quality: 1,
    supportsTransparency: false,
    description: 'Uncompressed, large file size',
  },
]

export const resizeOptions = [
  { id: 'none', label: 'Original Size', icon: '📏' },
  { id: 'percentage', label: 'Percentage', icon: '📊' },
  { id: 'dimensions', label: 'Specific Dimensions', icon: '📐' },
  { id: 'maxDimension', label: 'Max Dimension', icon: '⬛' },
]

export const defaultSettings = {
  outputFormat: 'png',
  quality: 0.95,
  resizeMode: 'none',
  percentage: 100,
  width: 1920,
  height: 1080,
  maxDimension: 1920,
  maintainAspectRatio: true,
}
